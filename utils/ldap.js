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
	// 	password: "",
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
		.then(
			function(){
				return findEntry(client, config.ldap.userDn, "(mail=" + email + ")");
			}, function(err){deferred.reject(err);}
		).then(
			function(result){
				cn = result.entries.collection[0].cn;
				return unbind(client);
			}, function(err){deferred.reject(err);}
		).then(
			function(){
				client = createClient();
				return bind(client, cn, password);
			}, function(err){deferred.reject(err);}
		).then(
			function(){
				return unbind(client);
			}, function(err){deferred.reject(err);}
		).then(deferred.resolve, function(err){deferred.reject(err);});
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
		.then(
			function(){
				return findEntry(client, config.ldap.userDn, "(mail=" + entry.mail + ")");
			}, function(err){deferred.reject(err);}
		).then(
			function(result){
				if(result.status === 0
				&& result.entries.collection.length > 0){
					deferred.reject("User already exists");
				}else{
					return findEntry(client, config.ldap.userDn, "(sAMAccountName=" + entry.sAMAccountName + "*)");
				}
			}, function(err){deferred.reject(err);}
		).then(
			function(result){
				var numericSuffix;
				if(result.status === 0){
					if(result.entries.collection.length > 0){
						numericSuffix = parseInt(result.entries.collection.length);
						entry.cn += numericSuffix;
						entry.sAMAccountName += numericSuffix;
						entry.userPrincipalName = entry.sAMAccountName + config.ldap.userPrincipalNameSuffix;
						currentUac = result.entries.collection[0].userAccountControl;
					}
					userDn = "cn=" + entry.cn + "," + config.ldap.userDn;
					return add(client, userDn, entry);
				}else{
					deferred.reject(result.status);
				}
			}, function(err){deferred.reject(err);}
		).then(
			function(){
				return modify(client, userDn, [{
					operation: "delete",
					modification: {unicodePwd: encodePassword("")}
				},{
					operation: "add",
					modification: {unicodePwd: encodePassword(password)}
				}]);
			}, function(err){deferred.reject(err);}
		).then(
			function(){
				return modify(client, userDn, {
					operation: "replace",
					modification: {userAccountControl: removeUacFlag(currentUac, uacFlags.disabled)}
				});
			}, function(err){deferred.reject(err);}
		).then(
			function(){
				var changes = [{
					operation: "add",
					modification: {member: userDn}
				}];
				for(var i = 0; userTemplate.roles && i < userTemplate.roles.length; i += 1){
					if(config.ldap.roleGroupCns[userTemplate.roles[i]]){
						changes.push({
							operation: "add",
							modification: {member: config.ldap.roleGroupCns[userTemplate.roles[i]] + "," + config.ldap.groupDn}
						});
					}
				}
				return modify(client, "cn=" + config.ldap.userGroupCn + "," + config.ldap.groupDn, changes);
			}, function(err){deferred.reject(err);}
		).then(
			function(){
				return unbind(client);
			}, function(err){deferred.reject(err);}
		).then(deferred.resolve, function(err){deferred.reject(err);});
		return deferred.promise;
	},

	setPassword: function(email, oldPassword, newPassword){
		var client = createClient(),
			deferred = q.defer();
		bindServiceAccount(client)
		.then(
			function(){
				return findEntry(client, config.ldap.userDn, "(mail=" + email + ")");
			}, function(err){deferred.reject(err);}
		).then(
			function(){
				if(result.status === 0
				&& result.entries.collection.length > 0){
					return modify(client, userDn, {
						operation: "replace",
						modification: {userAccountControl: addUacFlag(currentUac, uacFlags.disabled)}
					});
				}else{
					deferred.reject(result.status);
				}
			}, function(err){deferred.reject(err);}
		).then(
			function(result){
				return modify(client, "cn=" + result.entries.collection[0].cn + "," + config.ldap.userDn, [{
					operation: "delete",
					modification: {unicodePwd: encodePassword(oldPassword)}
				},{
					operation: "add",
					modification: {unicodePwd: encodePassword(newPassword)}
				}]);
			}, function(err){deferred.reject(err);}
		).then(
			function(){
				return modify(client, userDn, {
					operation: "replace",
					modification: {userAccountControl: removeUacFlag(currentUac, uacFlags.disabled)}
				});
			}, function(err){deferred.reject(err);}
		).then(deferred.resolve, function(err){deferred.reject(err);});
		return deferred.promise;
	},

	userExists: function(email){
		var client = createClient(),
			deferred = q.defer();
		bindServiceAccount(client)
		.then(
			function(){
				return findEntry(client, config.ldap.userDn, "(mail=" + email + ")");
			}, function(err){deferred.reject(err);}
		).then(
			function(result){
				if(result.status === 0
				&& result.entries.collection.length > 0){
					deferred.resolve();
				}else{
					deferred.reject(result.status);
				}
			}, function(err){deferred.reject(err);}
		);
		return deferred.promise;
	}
};
