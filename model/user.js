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

var mongoose = require("mongoose"),
	q = require("q"),
	bcrypt = require("bcrypt-nodejs"),
	config = require("../utils/common.js").config,
	ldap = require("../utils/ldap.js"),
	userSchema = {
		email: {
			type: String,
			required: true,
			unique: true
		},
		verified: {
			type: Boolean,
			default: false
		},
		created: {
			type: Date,
			default: Date.now
		},
		modified: {
			type: Date,
			default: null
		},
		accessed: {
			type: Date,
			default: null
		},
		vip: {
			type: Boolean,
			default: false
		},
		lanInviteDesired: {
			type: Boolean,
			default: true
		},
		blacklisted: {
			type: Boolean,
			default: false
		},
		firstName: {
			type: String,
			required: true
		},
		lastName: {
			type: String,
			required: true
		},
		primaryHandle: String,
		tertiaryHandles: [String],
		roles: [String],
		services: [{
			service: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Service",
				required: true
			},
			serviceHandle: String
		}]
	},
	userModel;

if(config.ldap.enabled){
	userSchema.cn = String;
	userSchema.lastSync = {
		type: Date,
		default: Date.now
	};
}else{
	userSchema.passwordHash = {
		type: String,
		required: true
	};
}

userSchema = mongoose.Schema(userSchema);

userSchema.methods.hash = function(pass){
	if(!config.ldap.enabled){
		return bcrypt.hashSync(pass, bcrypt.genSaltSync(), null);
	}else{
		console.error("Error: hash method should not be used with LDAP enabled");
		return "";
	}
};

userSchema.methods.isValidPassword = function(pass){
	if(!config.ldap.enabled){
		return bcrypt.compareSync(pass, this.passwordHash);
	}else{
		console.error("Error: isValidPassword method should not be used with LDAP enabled");
		return false;
	}
};

userSchema.methods.hasRole = function(role){
	if(config.ldap.enabled){
		return ldap.hasRole(this.email, role);
	}else{
		var deferred = q.defer();
		if(this.roles.indexOf(role) !== -1){
			deferred.resolve();
		}else{
			deferred.reject();
		}
		return deferred.promise;
	}
};

userSchema.methods.changePassword = function(oldPassword, newPassword){
	var user = this,
		deferred = q.defer();
	if(config.ldap.enabled){
		ldap.setPassword(user.cn, oldPassword, newPassword)
		.then(function(){
			user.modified = Date.now();
			user.save(function(err){
				if(err){
					console.error("Error: Unable to save changes to User collection in changePassword: " + err);
				}
			});
			deferred.resolve();
		}).catch(function(err){
			deferred.reject("Error: " + err.message);
		});
	}else{
		user.passwordHash = user.hash(newPassword);
		user.modified = Date.now();
		user.save(function(err){
			if(err){
				console.error("Error: Unable to save changes to User collection in changePassword: " + err);
			}
		});
		deferred.resolve();
	}
	return deferred.promise;
};

userSchema.methods.saveToDirectory = function(){
	var userTemplate,
		user = this;
	if(config.ldap.enabled){
		userTemplate = {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			verified: user.verified,
			roles: user.roles
		};
		return ldap.updateUser(user.cn, userTemplate)
		.then(function(){
			user.lastSync = Date.now();
			user.save(function(err){
				if(err){
					console.error("Error: Unable to save changes to User collection in saveToDirectory: " + err);
				}
			});
		});
	}
};

userSchema.methods.loadFromDirectory = function(){
	var user = this,
		deferred = q.defer();
	if(config.ldap.enabled){
		ldap.getUser(user.cn)
		.then(function(userTemplate){
			user.email = userTemplate.email;
			user.firstName = userTemplate.firstName;
			user.lastName = userTemplate.lastName;
			user.verified = userTemplate.verified;
			user.created = userTemplate.created;
			user.modified = userTemplate.modified;
			user.accessed = userTemplate.accessed;
			user.roles = userTemplate.roles;
			user.lastSync = Date.now();
			user.save(function(err){
				if(err){
					console.error("Error: Unable to save changes to User collection in loadFromDirectory: " + err);
				}
			});
			deferred.resolve();
		}).catch(function(err){
			console.error("Error: " + err.message);
			deferred.reject(err);
		});
	}
	return deferred.promise;
};

userModel = mongoose.model("User", userSchema);

// userEntryTemplate = {
// 	email: "",
//  password: "",
// 	verified: "",
//  vip: false,
//  lanInviteDesired: false,
//  blacklisted: false,
// 	firstName: "",
// 	lastName: "",
//  primaryHandle: "",
//  tertiaryHandles: [""],
// 	roles: [""],
//  services: [{
//   service: "",
//   serviceHandle: ""
//  }]
// }
userModel.createNew = function(userTemplate){
	var deferred = q.defer();
	userModel.findOne({"email": userTemplate.email}, function(err, user){
		// If we've encountered a database error, bail
		if(err){
			deferred.reject(err);
			return deferred.promise;
		}

		if(config.ldap.enabled){
			ldap.createUser(req.body)
			.then(function(cn){
				// If we've found the email in our database, the user already exists, do nothing
				if(user){
					deferred.reject(err);
				// Else, create the new user
				}else{
					delete userTemplate.password;

					var newUser = new userModel(userTemplate);
					newUser.cn = cn;
					newUser.save(function(err){
						if(err){
							deferred.reject(err);
							return;
						}
						deferred.resolve(newUser);
					});
				}
			}).catch(function(err){
				if(err === "User already exists" && !user){
					delete userTemplate.password;
					var newUser = new userModel(userTemplate);
					newUser.save(function(err){
						if(err){
							deferred.reject(err);
							return;
						}
						newUser.loadFromDirectory()
						.then(function(){
							deferred.resolve(newUser);
						}).catch(function(err){
							deferred.reject(err);
						});
					});
				}else{
					deferred.reject(err);
				}
			});
		}else{
			// If we've found the email in our database, the user already exists, do nothing
			if(user){
				deferred.resolve(false);
			// Else, create the new user
			}else{
				var password = userTemplate.password,
					newUser;
				delete userTemplate.password;
				newUser = new userModel(userTemplate);
				newUser.passwordHash = newUser.hash(password);
				newUser.save(function(err){
					if(err){
						deferred.reject(err);
						return;
					}
					deferred.resolve(newUser);
				});
			}
		}
	});
	return deferred.promise;
};

userModel.authenticate = function(email, password){
	var deferred = q.defer();
	if(config.ldap.enabled){
		ldap.authenticate(email, password)
		.then(function(){
			// Try to find a user with the given email in our app DB
			userModel.findOne({"email": email}, function(err, user){
				if(err){
					deferred.reject(err);
					return;
				}

				// If we found the user, our job is done
				if(user){
					deferred.resolve(user);
				// Otherwise if we didn't find the user, we already know it exists in 
				// the directory, so create our app DB entry now
				}else{
					var newUser = new userModel({
						email: email,
						roles: [],
						services: []
					});
					newUser.save(function(err){
						if(err){
							deferred.reject(err);
							return;
						}
						newUser.loadFromDirectory()
						.then(function(){
							deferred.resolve(newUser);
						}).catch(function(err){
							deferred.reject(err);
						});
					});
				}
			});
		}).catch(function(err){
			deferred.reject(err);
		});
	}else{
		// Try to find a user with the given email
		userModel.findOne({"email": email}, function(err, user){
			// If we've encountered a database error, bail
			if(err){
				deferred.reject(err);
				return;
			}

			// If we've found the user in the database and the given password matches, 
			// pass the user on to the next middleware
			if(user && user.isValidPassword(password)){
				deferred.resolve(user);
			// Else, set the flash and move on
			}else{
				deferred.resolve(false);
			}
		});
	}
	return deferred.promise;
};

module.exports = userModel;
