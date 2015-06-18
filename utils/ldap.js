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

var q = require("q"),
	ldapjs = require("ldapjs"),
	crypto = require("crypto"),
	config = require("./common.js").config,
	client = null,

	createClient = function(){
		return ldapjs.createClient({
			url: config.ldap.url
		});
	},

	ldapFormattedHash = function(value){
		var salt = crypto.randomBytes(256),
			hash = crypto.createHash("sha512");
		hash.update(value);
		hash.update(salt);
		return "{ssha512}" + Buffer.concat([hash.digest(), hash.salt]).toString('base64');
	},

	bind = function(client, email, password){
		var deferred = q.defer();
		client.bind("mail=" + email + "," + config.ldap.userDn, ldapFormattedHash(password), function(err){
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
				entries.collection.push(entry);
			});
			res.on("error", function(err){
				deferred.reject(err.message, entries);
			});
			res.on("end", function(result){
				deferred.resolve(result.status, entries);
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
	// 	firstName: "",
	// 	lastName: "",
	// 	roles: [""]
	// }
	translateFromUserEntryTemplate = function(template){
		var entry = {};
		if(template.firstName && template.lastName){
			entry.cn = template.firstName + " " + template.lastName;
			entry.displayName = entry.cn;
			entry.name = entry.cn;
			entry.givenName = template.firstName;
			entry.sn = template.lastName;
			entry.sAMAccountName = template.firstName.toLowerCase() + "." + template.lastName.toLowerCase();
			entry.userPrincipleName = entry.sAMAccountName + config.ldap.userPrincipalNameSuffix;
		}
		if(template.email) entry.mail = template.email;
		if(template.password) entry.userPassword = ldapFormattedHash(template.password);
		if(template.roles){
			// All users we create go into this default group
			entry.memberOf = [config.ldap.userGroupDn];
			for(var i = 0; i < template.roles.length; i += 1){
				if(config.ldap.roleGroupDns.indexOf(template.roles[i]) !== -1){
					entry.memberOf.push(config.ldap.roleGroupDns[template.roles[i]]);
				}
			}
		}
		return entry;
	},

	translateToUserEntryTemplate = function(entry){
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
			for(role in config.ldap.roleGroupDns){
				if(config.ldap.roleGroupDns[role] === entry.memberOf[i]){
					template.roles.push(role);
				}
			}
		}
	};

module.exports = {
	authenticate: function(email, password){
		var client = createClient(),
			deferred = q.defer();
		bind(client, email, password)
		.then(
			function(){
				return unbind(client);
			},
			function(err){
				deferred.reject(err);
			}
		).then(deferred.resolve, function(err){deferred.reject(err);});
		return deferred.promise;
	},

	createUser: function(entry){
		entry = translateFromUserEntryTemplate(entry);
		entry.objectClass = "user";

		var client = createClient(),
			deferred = q.defer();
		bindServiceAccount(client)
		.then(
			function(){
				return findEntry(client, config.ldap.userDn, "(sAMAccountName=" + entry.sAMAccountName + "*)");
			}, function(err){deferred.reject(err);}
		).then(
			function(status, entries){
				if(status === 0){
					if(entries.collection.length > 0){
						entry.sAMAccountName += parseInt(entries.collection.length);
					}
					return add(client, "mail=" + entry.mail + "," + config.ldap.userDn, entry);
				}else{
					deferred.reject(status);
				}
			}, function(err){deferred.reject(err);}
		).then(
			function(){
				return unbind(client);
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
			function(status, entries){
				if(status === 0){
					deferred.resolve();
				}else{
					deferred.reject(status);
				}
			}, function(err){deferred.reject(err);}
		);
		return deferred.promise;
	}
};
