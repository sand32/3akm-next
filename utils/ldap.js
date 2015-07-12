/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2015 Seth Anderson

This software is provided 'as-is', without any express or implied warranty. 
In no event will the authors be held liable for any damages arising from the 
use of this software.

Permission is granted to anyone to use this software for any purpose, 
including commercial applications, and to alter it and redistribute it 
freely, subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not 
claim that you wrote the original software. If you use this software in a 
product, an acknowledgment in the product documentation would be appreciated 
but is not required.

2. Altered source versions must be plainly marked as such, and must not be 
misrepresented as being the original software.

3. This notice may not be removed or altered from any source distribution.
-----------------------------------------------------------------------------
*/

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var q = require("q"),
	ldapjs = require("ldapjs"),
	crypto = require("crypto"),
	config = require("./common.js").config

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
		return ldapjs.createClient({
			url: config.ldap.url
		});
	},

	bind = function(client, cn, password){
		var deferred = q.defer();
		client.bind("cn=" + cn + "," + config.ldap.userDn, password, function(err){
			if(err){
				deferred.reject(err);
			}else{
				deferred.resolve();
			}
		});
		return deferred.promise;
	},

	bindServiceAccount = function(client){
		var deferred = q.defer();
		client.bind(config.ldap.serviceAccountDn, config.ldap.serviceAccountPassword, function(err){
			if(err){
				deferred.reject(err);
			}else{
				deferred.resolve();
			}
		});
		return deferred.promise;
	},

	unbind = function(client){
		var deferred = q.defer();
		client.unbind(function(err){
			if(err){
				deferred.reject(err);
			}else{
				deferred.resolve();
			}
		});
		return deferred.promise;
	},

	add = function(client, dn, entry){
		var deferred = q.defer();
		client.add(dn, entry, function(err){
			if(err){
				deferred.reject(err);
			}else{
				deferred.resolve();
			}
		});
		return deferred.promise;
	},

	modify = function(client, dn, changes){
		var deferred = q.defer();
		client.modify(dn, changes, function(err){
			if(err){
				deferred.reject(err);
			}else{
				deferred.resolve();
			}
		});
		return deferred.promise;
	},

	findEntry = function(client, dn, filter){
		var deferred = q.defer();
		client.search(dn, {
			scope: "sub",
			filter: filter
		}, function(err, res){
			if(err){
				deferred.reject(err);
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
				deferred.reject(err.message, entries);
			});
			res.on("end", function(result){
				deferred.resolve({status: result.status, entries: entries});
			});
		});
		return deferred.promise;
	},

	constructUniqueNaming = function(client, firstName, lastName){
		var deferred = q.defer();
		findEntry(client, config.ldap.userDn, "(sAMAccountName=" + firstName.toLowerCase() + "." + lastName.toLowerCase() + "*)")
		.then(function(result){
			var numericSuffix, names;
			if(result.status === 0
			&& result.entries.collection.length > 0){
				numericSuffix = parseInt(result.entries.collection.length);
				names = {
					cn: firstName + " " + lastName + numericSuffix,
					sAMAccountName: firstName.toLowerCase() + "." + lastName.toLowerCase() + numericSuffix,
					userPrincipalName: names.sAMAccountName + config.ldap.userPrincipalNameSuffix
				};
			}else{
				names = {
					cn: firstName + " " + lastName,
					sAMAccountName: firstName.toLowerCase() + "." + lastName.toLowerCase(),
					userPrincipalName: names.sAMAccountName + config.ldap.userPrincipalNameSuffix
				};
			}
			deferred.resolve(names);
		}).catch(function(err){deferred.reject(err);});
		return deferred.promise;
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
		if(template.verified) entry.extensionAttribute1 = template.verified;
		if(template.email) entry.mail = template.email;

		return entry;
	},

	translateToUserTemplate = function(entry){
		var template = {
			email: entry.mail,
			firstName: entry.givenName,
			lastName: entry.sn,
			created: ldapDateToJsDate(entry.whenCreated),
			modified: ldapDateToJsDate(entry.whenChanged),
			accessed: ldapIntervalToJsDate(entry.lastLogon),
			roles: []
		};

		// Read roles
		for(var i = 0; i < entry.memberOf.length; i += 1){
			for(role in config.ldap.roleGroupCns){
				if(config.ldap.roleGroupCns[role] === entry.memberOf[i]){
					template.roles.push(role);
				}
			}
		}
	};

module.exports = {
	authenticate: function(email, password){
		var client = createClient(),
			deferred = q.defer(),
			cn;
		bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(mail=" + email + ")");
		}).then(function(result){
			cn = result.entries.collection[0].cn;
			return unbind(client);
		}).then(function(){
			client = createClient();
			return bind(client, cn, password);
		}).then(function(){
			return unbind(client);
		}).then(deferred.resolve).catch(function(err){
			deferred.reject({reason: "ldaperr", message: err});
		});
		return deferred.promise;
	},

	createUser: function(userTemplate){
		var client = createClient(),
			deferred = q.defer(),
			password, userDn, currentUac;
		if(userTemplate.password){
			password = userTemplate.password;
		}else{
			deferred.reject("Must specify a password");
			return deferred.promise;
		}

		entry = translateFromUserTemplate(userTemplate);
		entry.objectClass = "user";

		bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(mail=" + entry.mail + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				deferred.reject({reason: "duplicate", message: "User already exists"});
			}else{
				return constructUniqueNaming(client, userTemplate.firstName, userTemplate.lastName);
			}
		}).then(function(names){
			entry.cn = names.cn;
			entry.sAMAccountName = names.sAMAccountName;
			entry.userPrincipalName = names.userPrincipalName;
			userDn = "cn=" + entry.cn + "," + config.ldap.userDn;
			return add(client, config.ldap.userDn, entry);
		}).then(function(){
			return findEntry(client, config.ldap.userDn, "(mail=" + entry.mail + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				currentUac = result.entries.collection[0].userAccountControl;
			}else{
				deferred.reject({reason: "ldaperr", message: "Failed to create directory user, unknown error"});
			}
		}).then(function(){
			return modify(client, userDn, [{
				operation: "delete",
				modification: {unicodePwd: encodePassword("")}
			},{
				operation: "add",
				modification: {unicodePwd: encodePassword(password)}
			}]);
		}).then(function(){
			return modify(client, userDn, {
				operation: "replace",
				modification: {userAccountControl: removeUacFlag(currentUac, uacFlags.disabled)}
			});
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
			return q.all(promises);
		}).then(function(){
			return unbind(client);
		}).then(function(){
			deferred.resolve(entry.cn);
		}).catch(function(err){
			deferred.reject({reason: "ldaperr", message: err});
		});
		return deferred.promise;
	},

	updateUser: function(cn, userTemplate){
		var client = createClient(),
			deferred = q.defer(),
			entry = translateFromUserTemplate(userTemplate),
			userDn = "cn=" + cn + "," + config.ldap.userDn;

		delete entry.cn;

		bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(mail=" + entry.mail + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0
			&& result.entries.collection[0].cn !== cn){
				deferred.reject({
					reason: "email-in-use",
					message: "Unable to update user, attempted to change email to one owned by another user"
				});
			}
			return modify(client, userDn, [{
				operation: "replace",
				modification: entry
			}]);
		}).then(function(){
			return unbind(client);
		}).catch(function(err){
			deferred.reject({reason: "ldaperr", message: err});
		});
		return deferred.promise;
	},

	setPassword: function(cn, oldPassword, newPassword){
		var client = createClient(),
			deferred = q.defer(),
			userDn = "cn=" + cn + "," + config.ldap.userDn;
		bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(cn=" + cn + ")");
		}).then(function(){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				return modify(client, userDn, {
					operation: "replace",
					modification: {userAccountControl: addUacFlag(currentUac, uacFlags.disabled)}
				});
			}else{
				deferred.reject({reason: "invalid-user", message: "Unable to set password, \"" + cn + "\" not found in directory"});
			}
		}).then(function(result){
			return modify(client, userDn, [{
				operation: "delete",
				modification: {unicodePwd: encodePassword(oldPassword)}
			},{
				operation: "add",
				modification: {unicodePwd: encodePassword(newPassword)}
			}]);
		}).then(function(){
			return modify(client, userDn, {
				operation: "replace",
				modification: {userAccountControl: removeUacFlag(currentUac, uacFlags.disabled)}
			});
		}).then(function(){
			return unbind(client);
		}).then(deferred.resolve).catch(function(err){
			deferred.reject({reason: "ldaperr", message: err});
		});
		return deferred.promise;
	},

	getUser: function(cn){
		var client = createClient(),
			deferred = q.defer();
		bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(cn=" + cn + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				deferred.resolve(translateToUserTemplate(result.entries.collection[0]));
			}else{
				deferred.reject({reason: "invalid-user", message: "Unable to retrieve user, \"" + cn + "\" not found in directory"})
			}
		}).catch(function(err){
			deferred.reject({reason: "ldaperr", message: err});
		});
		return deferred.promise;
	},

	hasRole: function(cn, role){
		var client = createClient(),
			deferred = q.defer();
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
						deferred.resolve();
						return;
					}
				}
			}
			deferred.reject();
		}).then(function(){
			return unbind(client);
		}).then(deferred.resolve).catch(function(err){
			deferred.reject({reason: "ldaperr", message: err});
		});
		return deferred.promise;
	},

	userExists: function(email){
		var client = createClient(),
			deferred = q.defer();
		bindServiceAccount(client)
		.then(function(){
			return findEntry(client, config.ldap.userDn, "(mail=" + email + ")");
		}).then(function(result){
			if(result.status === 0
			&& result.entries.collection.length > 0){
				deferred.resolve();
			}else{
				deferred.reject(result.status);
			}
		}).then(function(){
			return unbind(client);
		}).then(deferred.resolve).catch(function(err){
			deferred.reject({reason: "ldaperr", message: err});
		});
		return deferred.promise;
	}
};
