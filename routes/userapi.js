/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2016 Seth Anderson

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

var passport = require("passport"),
	mongoose = require("mongoose"),
	Promise = require("bluebird"),
	User = require("../model/user.js"),
	Token = require("../model/token.js"),
	Recipient = require("../model/recipient.js"),
	authorize = require("../authorization.js").authorize,
	authorizeSessionUser = require("../authorization.js").authorizeSessionUser,
	register = require("../utils/common.js").register,
	login = require("../utils/common.js").login,
	authenticate = require("../utils/common.js").authenticate,
	verifyRecaptcha = require("../utils/common.js").verifyRecaptcha,
	removeDuplicates = require("../utils/common.js").removeDuplicates,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	smtp = require("../utils/smtp.js"),
	config = require("../utils/common.js").config,
	handleError = require("../utils/common.js").handleError,
	log = require("../utils/log.js");

module.exports = function(app, prefix){
	app.post(prefix + "/register", 
		verifyRecaptcha, 
		register, 
	function(req, res){
		if(req.isAuthenticated()){
			smtp.sendEmailVerification(app, req.user, req.protocol + '://' + config.domain)
			.then(function(){
				res.status(201).send(req.user._id.toString());
			}).catch(function(err){
				res.status(500).end();
			});
		}else{
			res.status(403).end();
		}
	});

	app.post(prefix + "/login", 
		login, 
	function(req, res){
		if(req.isAuthenticated()){
			res.status(200).end();
		}else{
			res.status(403).end();
		}
	});

	app.post(prefix + "/logout", function(req, res){
		req.logout();
		res.status(200).end();
	});

	app.get(prefix + "/isloggedin", function(req, res){
		res.send({isLoggedIn: req.isAuthenticated()});
	});

	app.post(prefix + "/resetpassword", function(req, res){
		User.findOne({email: req.body.email})
		.then(function(user){
			if(!user) throw 404;
			return smtp.sendPasswordReset(app, user, req.protocol + '://' + config.domain);
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.post(prefix + "/:user/verify", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			return smtp.sendEmailVerification(app, user, req.protocol + '://' + config.domain);
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.post(prefix + "/:user/verify/:token", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		var verified = false, thisUser;
		Promise.all([
			User.findById(req.params.user),
			Token.findOne({token: req.params.token})
		]).spread(function(user, token){
			if(!user || !token) throw 404;
			verified = user.verified;
			thisUser = user;
			if(verified){
				return Promise.resolve();
			}
			if(token.validateToken("verify" + thisUser.email)){
				thisUser.verified = true;
				thisUser.modified = Date.now();
				return thisUser.save();
			}else{
				throw 400;
			}
		}).then(function(){
			Recipient.findOneAndRemove({email: thisUser.email})
			.then(function(recipient){
				if(recipient && recipient.vip){
					thisUser.vip = true;
					thisUser.save();
				}
			});
			thisUser.syncWithDirectory()
			.then(function(){
				res.status(200).end();
			}).catch(function(err){
				log.error("Successfully verified token for user \"" + thisUser.email + "\", but failed to sync with directory");
				res.status(500).end();
			});
		}).catch(function(err){
			if(verified){
				res.status(200).end();
				return;
			}
			handleError(res)(err);
		});
	});

	app.get(prefix + "/:user/verified", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}
		// Retrieve and return the "verified" value
		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			res.send({verified: user.verified});
		}).catch(handleError(res));
	});

	app.get(prefix, 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		User.find({})
		.sort("lastName firstName")
		.then(function(users){
			res.send(users || []);
		}).catch(function(err){
			res.status(500).end();
		});
	});

	app.get(prefix + "/:user", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}
		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			var responseData = {
				email: user.email,
				verified: user.verified,
				created: user.created,
				modified: user.modified,
				accessed: user.accessed,
				vip: user.vip,
				lanInviteDesired: user.lanInviteDesired,
				firstName: user.firstName,
				lastName: user.lastName,
				primaryHandle: user.primaryHandle,
				tertiaryHandles: user.tertiaryHandles,
				roles: user.roles,
				services: user.services
			};

			if(req.user.hasRole("admin")){
				responseData.__v = user.__v;
				responseData._id = user._id;
				responseData.blacklisted = user.blacklisted;
			}

			res.send(responseData);
		}).catch(handleError(res));
	});

	app.post(prefix, 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(req.body.roles){
			req.body.roles = removeDuplicates(req.body.roles);
		}
		User.createNew(req.body)
		.then(function(newUser){
			res.status(201)
			.location(prefix + "/" + newUser._id)
			.send({_id: newUser._id});
		}).catch(function(err){
			res.status(400).end();
		});
	});

	app.put(prefix + "/:user", 
		authenticate, 
		authorizeSessionUser(), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}
		var editUser;

		Promise.all([
			User.findOne({email: req.body.email}),
			User.findById(req.params.user)
		]).spread(function(existingUser, user2){
			editUser = user2;
			if(!editUser) throw 404;
			if(existingUser && existingUser._id.toString() !== editUser._id.toString()){
				throw 409;
			}
			if(req.body.email !== editUser.email){
				editUser.verified = false;
			}
			editUser.email = req.body.email;
			editUser.firstName = req.body.firstName;
			editUser.lastName = req.body.lastName;
			editUser.lanInviteDesired = req.body.lanInviteDesired;
			editUser.primaryHandle = req.body.primaryHandle;
			editUser.tertiaryHandles = removeDuplicates(req.body.tertiaryHandles);
			editUser.modified = Date.now();

			var nextPromise;
			return req.user.hasRole("admin")
			.then(function(){
				editUser.verified = req.body.verified;
				editUser.vip = req.body.vip;
				editUser.blacklisted = req.body.blacklisted;
				editUser.roles = removeDuplicates(req.body.roles);
				editUser.services = req.body.services;
				editUser.save();
			}).catch(function(){
				editUser.save();
			});
		}).then(function(){
			return editUser.syncWithDirectory();
		}).then(function(){
			return res.status(200).end();
		}).catch(handleError(res));
	});

	app.put(prefix + "/:user/password", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		// Update the user 
		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			return user.changePassword(req.body.oldPassword, req.body.newPassword);
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.post(prefix + "/:user/password/reset/:token", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		Promise.all([
			User.findById(req.params.user),
			Token.findOne({token: req.params.token})
		]).spread(function(user, token){
			if(!user || !token) throw 404;
			if(token.validateToken("passwordreset" + user.email)){
				user.resetPassword(req.body.newPassword)
				.then(function(){
					Token.remove({token: req.params.token}).exec();
					res.status(200).end();
				}).catch(function(err){
					log.error("Successfully verified token for user \"" + user.email + "\", but failed to reset password");
					res.status(500).end();
				});
			}else{
				throw 400;
			}
		}).catch(handleError(res));
	});

	app.post(prefix + "/:user/sync", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)
		|| !config.ldap.enabled){
			return res.status(404).end();
		}

		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			return user.syncWithDirectory();
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.post(prefix + "/:user/recreateindirectory", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)
		|| !config.ldap.enabled){
			return res.status(404).end();
		}

		var user;
		User.findById(req.params.user)
		.then(function(doc){
			user = doc;
			if(!user) throw 404;
			return user.recreateInDirectory(req.body.password);
		}).then(function(cn){
			user.cn = cn;
			return user.save();
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});
};
