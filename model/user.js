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

var mongoose = require("mongoose"),
	Promise = require("bluebird")
mongoose.Promise = Promise;
var bcrypt = require("bcrypt"),
	config = require("../utils/common.js").config,
	ldap = require("../utils/ldap.js"),
	log = require("../utils/log.js"),
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
		log.error("hash method should not be used with LDAP enabled");
		return "";
	}
};

userSchema.methods.isValidPassword = function(pass){
	if(!config.ldap.enabled){
		return bcrypt.compareSync(pass, this.passwordHash);
	}else{
		log.error("isValidPassword method should not be used with LDAP enabled");
		return false;
	}
};

userSchema.methods.hasRole = function(role){
	var user = this;
	if(config.ldap.enabled){
		return ldap.hasRole(user.cn, role);
	}else{
		if(user.roles.indexOf(role) !== -1){
			return Promise.resolve(true);
		}else{
			return Promise.resolve(false);
		}
	}
};

userSchema.methods.changePassword = function(oldPassword, newPassword){
	var user = this;
	return new Promise(function(resolve, reject){
		if(config.ldap.enabled){
			ldap.setPassword(user.cn, oldPassword, newPassword)
			.then(function(){
				user.modified = Date.now();
				user.save(function(err){
					if(err){
						log.error(err);
					}
				});
				resolve();
			}).catch(function(err){
				log.error(err);
				reject(err);
			});
		}else{
			if(user.isValidPassword(oldPassword)){
				user.passwordHash = user.hash(newPassword);
				user.modified = Date.now();
				user.save(function(err){
					if(err){
						log.error(err);
					}
					resolve();
				});
			}else{
				reject({
					reason: "invalid-password",
					message: "Unable to change password, failed to authenticate old password"
				});
			}
		}
	});
};

userSchema.methods.resetPassword = function(newPassword){
	var user = this;
	return new Promise(function(resolve, reject){
		if(config.ldap.enabled){
			ldap.resetPassword(user.cn, newPassword)
			.then(function(){
				user.modified = Date.now();
				user.save(function(err){
					if(err){
						log.error(err);
					}
				});
				resolve();
			}).catch(function(err){
				log.error(err);
				reject(err);
			});
		}else{
			user.passwordHash = user.hash(newPassword);
			user.modified = Date.now();
			user.save(function(err){
				if(err){
					log.error(err);
				}
				resolve();
			});
		}
	});
};

userSchema.methods.syncWithDirectory = function(){
	if(!config.ldap.enabled){
		return Promise.resolve();
	}

	var user = this;
	return new Promise(function(resolve, reject){
		ldap.getUser(user.cn)
		.then(function(userTemplate){
			if(user.modified
			&& user.modified > user.lastSync
			&& userTemplate.modified < user.lastSync){
				userTemplate = {
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					verified: user.verified,
					roles: user.roles
				};
				ldap.updateUser(user.cn, userTemplate)
				.then(function(newCn){
					user.cn = newCn;
					user.lastSync = Date.now();
					user.save(function(err){
						if(err){
							log.error(err);
						}
						resolve();
					});
				}).catch(function(err){
					log.error(err);
					reject(err);
				});
			}else{
				user.email = userTemplate.email;
				user.firstName = userTemplate.firstName;
				user.lastName = userTemplate.lastName;
				user.verified = userTemplate.verified;
				user.created = userTemplate.created;
				user.roles = userTemplate.roles;
				user.lastSync = Date.now();
				user.save(function(err){
					if(err){
						log.error(err);
					}
				});
				resolve();
			}
		}).catch(function(err){
			log.error(err);
			reject(err);
		});
	});
},

userSchema.methods.recreateInDirectory = function(tempPassword){
	var user = this;
	var userTemplate = {
		email: this.email,
		password: tempPassword,
		firstName: this.firstName,
		lastName: this.lastName,
		roles: []
	};
	return ldap.createUser(userTemplate)
	.then(function(cn){
		userTemplate = {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			verified: user.verified,
			roles: user.roles
		};
		ldap.updateUser(user.cn, userTemplate)
		.then(function(newCn){
			user.cn = newCn;
			user.lastSync = Date.now();
			user.save(function(err){
				if(err){
					log.error(err);
				}
			});
		}).catch(function(err){
			log.error(err);
		});
	});
},

userSchema.methods.updateDirectory = function(){
	var user = this,
		userTemplate = {
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			verified: user.verified,
			roles: user.roles
		};
	return new Promise(function(resolve, reject){
		ldap.updateUser(user.cn, userTemplate)
		.then(function(newCn){
			user.cn = newCn;
			user.lastSync = Date.now();
			user.save(function(err){
				if(err){
					log.error(err);
				}
				resolve();
			});
		}).catch(function(err){
			log.error(err);
			reject(err);
		});
	});
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
	return new Promise(function(resolve, reject){
		userModel.findOne({"email": userTemplate.email}, function(err, user){
			// If we've encountered a database error, bail
			if(err){
				reject(err);
				return;
			}

			if(config.ldap.enabled){
				ldap.createUser(userTemplate)
				.then(function(cn){
					// If we've found the email in our database, the user already exists, do nothing
					if(user){
						reject(err);
					// Else, create the new user
					}else{
						delete userTemplate.password;

						var newUser = new userModel(userTemplate);
						newUser.cn = cn;
						newUser.save(function(err){
							if(err){
								reject(err);
								return;
							}
							resolve(newUser);
						});
					}
				}).catch(function(err){
					if(err.reason === "duplicate" && !user){
						delete userTemplate.password;
						var newUser = new userModel(userTemplate);
						newUser.save(function(err){
							if(err){
								reject(err);
								return;
							}
							newUser.syncWithDirectory()
							.then(function(){
								resolve(newUser);
							}).catch(function(err){
								reject(err);
							});
						});
					}else{
						log.error(err);
						reject(err);
					}
				});
			}else{
				// If we've found the email in our database, the user already exists, do nothing
				if(user){
					resolve(false);
				// Else, create the new user
				}else{
					var password = userTemplate.password,
						newUser;
					delete userTemplate.password;
					newUser = new userModel(userTemplate);
					newUser.passwordHash = newUser.hash(password);
					newUser.save(function(err){
						if(err){
							reject(err);
							return;
						}
						resolve(newUser);
					});
				}
			}
		});
	});
};

userModel.authenticate = function(email, password){
	return new Promise(function(resolve, reject){
		if(config.ldap.enabled){
			ldap.authenticate(email, password)
			.then(function(){
				// Try to find a user with the given email in our app DB
				userModel.findOne({"email": email}, function(err, user){
					if(err){
						reject(err);
						return;
					}

					// If we found the user, our job is done
					if(user){
						user.accessed = Date.now();
						user.syncWithDirectory()
						.then(function(){
							resolve(user);
						}).catch(function(){
							resolve(user);
						});
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
								reject(err);
								return;
							}
							newUser.accessed = Date.now();
							newUser.syncWithDirectory()
							.then(function(){
								resolve(newUser);
							}).catch(function(err){
								reject(err);
							});
						});
					}
				});
			}).catch(function(err){
				reject(err);
				log.warn("Failed sign-in attempt for account: \"" + email + "\"");
			});
		}else{
			// Try to find a user with the given email
			userModel.findOne({"email": email}, function(err, user){
				// If we've encountered a database error, bail
				if(err){
					reject(err);
					return;
				}

				// If we've found the user in the database and the given password matches, 
				// pass the user on to the next middleware
				if(user && user.isValidPassword(password)){
					resolve(user);
				// Else, set the flash and move on
				}else{
					reject({reason: "invalid-credentials"});
				}
			});
		}
	});
};

module.exports = userModel;
