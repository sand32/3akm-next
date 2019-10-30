/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2018 Seth Anderson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
-----------------------------------------------------------------------------
*/

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var Promise = require("bluebird"),
	ldapjs = require("ldapjs"),
	config = require("./common.js").config,
	log = require("./log.js"),

	uacFlags = {
		disabled: 0x00000002,
		homeDirRequired: 0x00000008,
		lockout: 0x00000010,
		passwordNotRequired: 0x00000020,
		passwordCantChange: 0x00000040,
		encryptedTextPasswordAllowed: 0x00000080,
		normalAccount: 0x00000200,
		interdomainTrustAccount: 0x00000800,
		workstationTrustAccount: 0x00001000,
		serverTrustAccount: 0x00002000,
		dontExpirePassword: 0x00010000
	},

	addUacFlag = function(value, flag){
		return value | flag;
	},

	removeUacFlag = function(value, flag){
		return value & ~flag;
	},

	encodePassword = function(password){
		return new Buffer("\"" + password + "\"", "utf16le").toString();
	},

	createClient = function(){
		var client = ldapjs.createClient({
			url: config.ldap.url,
			reconnect: true
		});
		client.on("error", function(err){
			log.warn("LDAP connection failed, reconnecting...");
		});
		return client;
	},

	// promisifyAll on the client object explodes sometimes.
	// I need to figure out why. Until then...
	handleCallback = function(resolve, reject){
		return function(err){
			if(err){
				reject(err);
			}else{
				resolve();
			}
		};
	},

	bind = function(client, cn, password){
		return new Promise(function(resolve, reject){
			client.bind("cn=" + cn + "," + config.ldap.userDn, password, handleCallback(resolve, reject));
		});
	},

	bindServiceAccount = function(client){
		return new Promise(function(resolve, reject){
			client.bind(config.ldap.serviceAccountDn, config.ldap.serviceAccountPassword, handleCallback(resolve, reject));
		});
	},

	unbind = function(client){
		return new Promise(function(resolve, reject){
			client.unbind(handleCallback(resolve, reject));
		});
	},

	add = function(client, dn, entry){
		return new Promise(function(resolve, reject){
			client.add(dn, entry, handleCallback(resolve, reject));
		});
	},

	modify = function(client, dn, changes){
		return new Promise(function(resolve, reject){
			client.modify(dn, changes, handleCallback(resolve, reject));
		});
	},

	rename = function(client, dn, newDn){
		if(dn === newDn){
			return Promise.resolve();
		}
		return new Promise(function(resolve, reject){
			client.modifyDN(dn, newDn, handleCallback(resolve, reject));
		});
	},

	deleteEntry = function(client, dn){
		return new Promise(function(resolve, reject){
			client.del(dn, handleCallback(resolve, reject));
		});
	},

	findEntry = function(client, dn, filter){
		return new Promise(function(resolve, reject){
			client.search(dn, {
				scope: "sub",
				filter: filter
			}, function(err, res){
				if(err){
					reject(err);
				}
				var entries = {
					collection: [],

					find: function(fieldName, fieldValue){
						for(var i = 0; i < entries.collection.length; i += 1){
							if(entries.collection[i][fieldName] === fieldValue){
								return entries.collection[i];
							}
						}
					},

					contains: function(fieldName, fieldValue){
						for(var i = 0; i < entries.collection.length; i += 1){
							if(entries.collection[i][fieldName] === fieldValue){
								return true;
							}
						}
						return false;
					}
				};

				res.on("searchEntry", function(entry){
					entries.collection.push(entry.object);
				});
				res.on("error", function(err){
					reject(err.message, entries);
				});
				res.on("end", function(result){
					resolve({status: result.status, entries: entries});
				});
			});
		});
	},

	constructUniqueNaming = function(client, firstName, lastName, existingCn){
		return findEntry(client, config.ldap.userDn, "(sAMAccountName=" + firstName.toLowerCase() + "." + lastName.toLowerCase() + "*)")
		.then(function(result){
			var numericSuffix, names, i, thisEntry, otherSuffix;
			if(result.status === 0
			&& result.entries.collection.length > 0){
				numericSuffix = 0;
				for(i = 0; i < result.entries.collection.length; i += 1){
					thisEntry = result.entries.collection[i];
					if(existingCn && thisEntry.cn.toLowerCase() === existingCn.toLowerCase()){
						names = {
							cn: thisEntry.cn,
							sAMAccountName: thisEntry.sAMAccountName,
							userPrincipalName: thisEntry.userPrincipalName
						};
						return names;
					}
					otherSuffix = thisEntry.sAMAccountName.replace(firstName.toLowerCase() + "." + lastName.toLowerCase(), "");
					otherSuffix = otherSuffix !== "" ? parseInt(otherSuffix) : 0;
					numericSuffix = Math.max(numericSuffix, otherSuffix) + 1;
				}
				numericSuffix = numericSuffix.toString();
				names = {
					cn: firstName + " " + lastName + numericSuffix,
					sAMAccountName: firstName.toLowerCase() + "." + lastName.toLowerCase() + numericSuffix
				};
				if(names.sAMAccountName.length > 20){
					names.sAMAccountName = (firstName.toLowerCase() + "." + lastName.toLowerCase()).substr(0, 20 - numericSuffix.length) + numericSuffix;
				}
				names.userPrincipalName = names.sAMAccountName + config.ldap.userPrincipalNameSuffix;
			}else{
				names = {
					cn: firstName + " " + lastName,
					sAMAccountName: firstName.toLowerCase() + "." + lastName.toLowerCase()
				};
				if(names.sAMAccountName.length > 20){
					names.sAMAccountName = (firstName.toLowerCase() + "." + lastName.toLowerCase()).substr(0, 20);
				}
				names.userPrincipalName = names.sAMAccountName + config.ldap.userPrincipalNameSuffix;
			}
			return names;
		});
	},

	ldapDateToJsDate = function(ldapDate){
		var year = ldapDate.substr(0, 4),
			month = ldapDate.substr(4, 2),
			day = ldapDate.substr(6, 2),
			hour = ldapDate.substr(8, 2),
			minute = ldapDate.substr(10, 2),
			second = ldapDate.substr(12, 2);
		return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
	},

	ldapIntervalToJsDate = function(ldapInterval){
		var sec = Math.round(ldapInterval / 10000000);
		sec -= 11644473600;
		return new Date(sec * 1000);
	},

	// userEntryTemplate = {
	// 	email: "",
	// 	verified: "",
	// 	firstName: "",
	// 	lastName: "",
	// 	roles: [""]
	// }
	translateFromUserTemplate = function(template){
		var entry = {};
		if(template.firstName && template.lastName){
			entry.cn = template.firstName + " " + template.lastName;
			entry.displayName = entry.cn;
			entry.name = entry.cn;
			entry.givenName = template.firstName;
			entry.sn = template.lastName;
			entry.sAMAccountName = template.firstName.toLowerCase() + "." + template.lastName.toLowerCase();
			entry.userPrincipalName = entry.sAMAccountName + config.ldap.userPrincipalNameSuffix;
		}
		if(template.verified) entry.extensionAttribute1 = template.verified ? "true" : "false";
		if(template.email) entry.mail = template.email;

		return entry;
	},

	translateToUserTemplate = function(entry){
		var template = {
			email: entry.mail,
			verified: entry.extensionAttribute1 === "true",
			firstName: entry.givenName,
			lastName: entry.sn,
			created: ldapDateToJsDate(entry.whenCreated),
			modified: ldapDateToJsDate(entry.whenChanged),
			accessed: ldapIntervalToJsDate(entry.lastLogon),
			roles: []
		}, groupCn;

		// Read roles
		for(var i = 0; i < entry.memberOf.length; i += 1){
			groupCn = entry.memberOf[i].split(",")[0].toLowerCase().replace("cn=", "");
			for(var role in config.ldap.roleGroupCns){
				if(config.ldap.roleGroupCns[role] === groupCn){
					template.roles.push(role);
				}
			}
		}

		return template;
	};

module.exports = {
	authenticate: function(email, password){
		var client = createClient(),
			cn;

		return bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(mail=" + email + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				cn = result.entries.collection[0].cn;
				return unbind(client);
			}else{
				throw {
					reason: "invalid-user",
					message: "Unable to retrieve user, \"" + cn + "\" not found in directory"
				};
			}
		}).then(function(){
			client = createClient();
			return bind(client, cn, password);
		}).then(function(){
			unbind(client);
			return Promise.resolve(cn);
		}).catch(function(err){
			unbind(client);
			if(err.reason){
				throw err;
			}else{
				throw {reason: "ldap-error", message: err};
			}
		});
	},

	createUser: function(userTemplate){
		var client = createClient(),
			password, userDn, currentUac, lastAttemptedStep = "none";
		if(userTemplate.password){
			password = userTemplate.password;
		}else{
			return Promise.reject({
				reason: "no-password",
				message: "A password must be provided on user creation"
			});
		}

		entry = translateFromUserTemplate(userTemplate);
		entry.objectClass = "user";

		return bindServiceAccount(client)
		.then(function(){
			lastAttemptedStep = "find-by-email";
			return findEntry(client, config.ldap.userDn, "(mail=" + entry.mail + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				throw {reason: "duplicate", message: "User already exists"};
			}else{
				return constructUniqueNaming(client, userTemplate.firstName, userTemplate.lastName);
			}
		}).then(function(names){
			entry.cn = names.cn;
			entry.sAMAccountName = names.sAMAccountName;
			entry.userPrincipalName = names.userPrincipalName;
			userDn = "cn=" + entry.cn + "," + config.ldap.userDn;
			lastAttemptedStep = "add-entry";
			return add(client, userDn, entry);
		}).then(function(){
			lastAttemptedStep = "find-new-entry";
			return findEntry(client, config.ldap.userDn, "(mail=" + entry.mail + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				currentUac = result.entries.collection[0].userAccountControl;
			}else{
				throw {
					reason: "ldap-error",
					message: "Failed to create directory user, unknown error"
				};
			}
		}).then(function(){
			lastAttemptedStep = "set-password";
			return modify(client, userDn, [{
				operation: "delete",
				modification: {unicodePwd: encodePassword("")}
			},{
				operation: "add",
				modification: {unicodePwd: encodePassword(password)}
			}]);
		}).then(function(){
			lastAttemptedStep = "enable-user-and-set-verified";
			currentUac = removeUacFlag(currentUac, uacFlags.disabled);
			return modify(client, userDn, [{
				operation: "replace",
				modification: {userAccountControl: currentUac}
			},{
				operation: "add",
				modification: {extensionAttribute1: userTemplate.verified ? "true" : "false"}
			}]);
		}).then(function(){
			lastAttemptedStep = "set-dont-expire-password";
			return modify(client, userDn, [{
				operation: "replace",
				modification: {userAccountControl: addUacFlag(currentUac, uacFlags.dontExpirePassword)}
			}]);
		}).then(function(){
			var promises = [modify(client, "cn=" + config.ldap.userGroupCn + "," + config.ldap.groupDn, {
				operation: "add",
				modification: {member: userDn}
			})];
			for(var i = 0; userTemplate.roles && i < userTemplate.roles.length; i += 1){
				if(config.ldap.roleGroupCns[userTemplate.roles[i]]){
					promises.push(modify(client, "cn=" + config.ldap.roleGroupCns[userTemplate.roles[i]] + "," + config.ldap.groupDn, {
						operation: "add",
						modification: {member: userDn}
					}));
				}
			}
			lastAttemptedStep = "add-groups";
			return Promise.all(promises);
		}).then(function(){
			lastAttemptedStep = "unbind";
			return unbind(client);
		}).then(function(){
			return entry.cn;
		}).catch(function(err){
			unbind(client);
			if(err.reason){
				throw err;
			}else{
				module.exports.deleteUser(entry.cn);
				if(lastAttemptedStep === "set-password"){
					throw {reason: "invalid-password", message: "Unable to set password for user \"" + entry.cn + "\", password rejected by the directory"};
				}else{
					throw {reason: "ldap-error", message: err.message};
				}
			}
		});
	},

	deleteUser: function(cn){
		var client = createClient();

		return bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(cn=" + cn + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				return deleteEntry(client, "cn=" + cn + "," + config.ldap.userDn);
			}
		}).then(function(){
			return unbind(client);
		}).catch(function(err){
			unbind(client);
			if(err.reason){
				throw err;
			}else{
				throw {reason: "ldap-error", message: err};
			}
		});
	},

	updateUser: function(cn, userTemplate){
		var client = createClient(),
			entry = translateFromUserTemplate(userTemplate),
			userDn = "cn=" + cn + "," + config.ldap.userDn,
			currentEntry, newCn;

		delete entry.cn;

		return bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(cn=" + cn + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				currentEntry = result.entries.collection[0];
			}
			return findEntry(client, config.ldap.userDn, "(mail=" + entry.mail + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				if(result.entries.collection[0].cn !== cn){
					throw {
						reason: "email-in-use",
						message: "Unable to update user, attempted to change email to one owned by another user"
					};
				}
			}
			return constructUniqueNaming(client, userTemplate.firstName, userTemplate.lastName, cn);
		}).then(function(names){
			newCn = names.cn;
			entry.sAMAccountName = names.sAMAccountName;
			entry.userPrincipalName = names.userPrincipalName;
			delete entry.name;
			return modify(client, userDn, [{
				operation: "replace",
				modification: entry
			}]);
		}).then(function(){
			return modify(client, userDn, [{
				operation: "replace",
				modification: {extensionAttribute1: userTemplate.verified ? "true" : "false"}
			}]);
		}).then(function(){
			var promises = [],
				roleName, groupCn, groupDn,
				i, j, role, foundGroup;

			userTemplate.roles = userTemplate.roles || [];
			currentEntry.memberOf = [].concat(currentEntry.memberOf);

			// Remove the user from any role groups it no longer has the role for
			for(i = 0; i < currentEntry.memberOf.length; i += 1){
				groupCn = currentEntry.memberOf[i].split(",")[0].toLowerCase().replace("cn=", "");
				if(groupCn === "3akm-users"){
					continue;
				}

				for(role in config.ldap.roleGroupCns){
					if(config.ldap.roleGroupCns[role] === groupCn){
						roleName = role;
						break;
					}
				}
				if(userTemplate.roles.indexOf(roleName) === -1){
					promises.push(modify(client, currentEntry.memberOf[i], {
						operation: "delete",
						modification: {member: userDn}
					}));
				}
			}

			// Add the user to any role groups it now has the role for
			for(i = 0; i < userTemplate.roles.length; i += 1){
				foundGroup = false;
				groupDn = "cn=" + config.ldap.roleGroupCns[userTemplate.roles[i]] + "," + config.ldap.groupDn;
				for(j = 0; j < currentEntry.memberOf.length; j += 1){
					if(currentEntry.memberOf[j].toLowerCase() === groupDn){
						foundGroup = true;
						break;
					}
				}
				if(!foundGroup){
					promises.push(modify(client, groupDn, {
						operation: "add",
						modification: {member: userDn}
					}));
				}
			}
			return Promise.all(promises);
		}).then(function(){
			if(newCn !== cn){
				return rename(client, userDn, "cn=" + newCn + "," + config.ldap.userDn);
			}
			return Promise.resolve();
		}).then(function(){
			return unbind(client);
		}).then(function(){
			return newCn;
		}).catch(function(err){
			unbind(client);
			if(err.reason){
				throw err;
			}else{
				throw {reason: "ldap-error", message: err};
			}
		});
	},

	setPassword: function(cn, oldPassword, newPassword){
		var client = createClient(),
			userDn = "cn=" + cn + "," + config.ldap.userDn;

		return bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(cn=" + cn + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				currentUac = result.entries.collection[0].userAccountControl;
				return modify(client, userDn, {
					operation: "replace",
					modification: {userAccountControl: addUacFlag(currentUac, uacFlags.disabled)}
				});
			}else{
				throw {
					reason: "invalid-user",
					message: "Unable to set password, \"" + cn + "\" not found in directory"
				};
			}
		}).then(function(){
			return modify(client, userDn, [{
				operation: "delete",
				modification: {unicodePwd: encodePassword(oldPassword)}
			},{
				operation: "add",
				modification: {unicodePwd: encodePassword(newPassword)}
			}]).catch(function(){
				modify(client, userDn, {
					operation: "replace",
					modification: {userAccountControl: removeUacFlag(currentUac, uacFlags.disabled)}
				});
				return Promise.reject({reason: "invalid-password", message: "Unable to change password, new password does not meet format requirements"});
			});
		}).then(function(){
			return modify(client, userDn, {
				operation: "replace",
				modification: {userAccountControl: removeUacFlag(currentUac, uacFlags.disabled)}
			});
		}).then(function(){
			return unbind(client);
		}).catch(function(err){
			unbind(client);
			if(err.reason){
				throw err;
			}else{
				throw {reason: "ldap-error", message: err};
			}
		});
	},

	resetPassword: function(cn, newPassword){
		var client = createClient(),
			userDn = "cn=" + cn + "," + config.ldap.userDn;

		return bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(cn=" + cn + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				currentUac = result.entries.collection[0].userAccountControl;
				return modify(client, userDn, {
					operation: "replace",
					modification: {userAccountControl: addUacFlag(currentUac, uacFlags.disabled)}
				});
			}else{
				throw {
					reason: "invalid-user",
					message: "Unable to reset password, \"" + cn + "\" not found in directory"
				};
			}
		}).then(function(){
			return modify(client, userDn, {
				operation: "replace",
				modification: {unicodePwd: encodePassword(newPassword)}
			}).catch(function(){
				modify(client, userDn, {
					operation: "replace",
					modification: {userAccountControl: removeUacFlag(currentUac, uacFlags.disabled)}
				});
				return Promise.reject({reason: "invalid-password", message: "Unable to change password, new password does not meet format requirements"});
			});
		}).then(function(){
			return modify(client, userDn, {
				operation: "replace",
				modification: {userAccountControl: removeUacFlag(currentUac, uacFlags.disabled)}
			});
		}).then(function(){
			return unbind(client);
		}).catch(function(err){
			unbind(client);
			if(err.reason){
				throw err;
			}else{
				throw {reason: "ldap-error", message: err};
			}
		});
	},

	getUser: function(cn){
		var client = createClient();

		return bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(cn=" + cn + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				return translateToUserTemplate(result.entries.collection[0]);
			}else{
				throw {
					reason: "invalid-user",
					message: "Unable to retrieve user, \"" + cn + "\" not found in directory"
				};
			}
		}).catch(function(err){
			unbind(client);
			if(err.reason){
				throw err;
			}else{
				throw {reason: "ldap-error", message: err};
			}
		});
	},

	hasRole: function(cn, role){
		var client = createClient();

		return new Promise(function(resolve, reject){
			bindServiceAccount(client)
			.then(function(){
				return findEntry(client, config.ldap.userDn, "(cn=" + cn + ")");
			}).then(function(result){
				var entry, groupDn = "cn=" + config.ldap.roleGroupCns[role].toLowerCase() + "," + config.ldap.groupDn.toLowerCase();
				if(result.status === 0
				&& result.entries.collection.length > 0){
					entry = result.entries.collection[0];
					for(var i = 0; i < entry.memberOf.length; i += 1){
						if(entry.memberOf[i].toLowerCase() === groupDn){
							resolve(true);
							return;
						}
					}
				}
				resolve(false);
			}).then(function(){
				return unbind(client);
			}).catch(function(err){
				unbind(client);
				if(err.reason){
					reject(err);
				}else{
					reject({reason: "ldap-error", message: err});
				}
			});
		});
	},

	userExists: function(email){
		var client = createClient();

		return bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(mail=" + email + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				return Promise.resolve();
			}else{
				throw {
					reason: "invalid-user",
					message: "Unable to retrieve user, no user with the email \"" + email + "\" found"
				};
			}
		}).then(function(){
			return unbind(client);
		}).catch(function(err){
			unbind(client);
			if(err.reason){
				throw err;
			}else{
				throw {reason: "ldap-error", message: err};
			}
		});
	}
};
