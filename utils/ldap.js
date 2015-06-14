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
	loadConfig = require("./common.js").loadConfig,
	config = loadConfig(__dirname + "/config/config.json"),
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
		client.bind("mail=" + email + "," + config.ldap.3akmUserDn, ldapFormattedHash(password), function(err){
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

	// userEntryTemplate = {
	// 	email: "",
	// 	firstName: "",
	// 	lastName: ""
	// }
	translateUserEntryTemplate = function(template){
		return {
			cn: template.firstName + " " + template.lastName,
			givenName: template.firstName,
			sn: template.lastName,
			mail: template.email,
			userPassword: ldapFormattedHash(template.password)
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
		).then(
			function(){
				deferred.resolve();
			},
			function(err){
				deferred.reject(err);
			}
		);
		return deferred.promise;
	},

	createUser: function(entry){
		entry = translateUserEntryTemplate(entry);
		var client = createClient(),
			deferred = q.defer();
		bindServiceAccount(client)
		.then(
			function(){
				client.add("cn=" + entry.cn, entry, function(err){
					if(err){
						deferred.reject(err);
					}else{
						deferred.resolve();
					}
				});
			}
		);
		return deferred.promise;
	}
};
