/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2017 Seth Anderson

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

var passport = require("passport"),
	Promise = require("bluebird"),
	User = require("../model/user.js"),
	Token = require("../model/token.js"),
	Recipient = require("../model/recipient.js"),
	authorize = require("../utils/authorization.js").authorize,
	authorizeSessionUser = require("../utils/authorization.js").authorizeSessionUser,
	register = require("../utils/authentication.js").register,
	login = require("../utils/authentication.js").login,
	authenticate = require("../utils/authentication.js").authenticate,
	verifyRecaptcha = require("../utils/common.js").verifyRecaptcha,
	removeDuplicates = require("../utils/common.js").removeDuplicates,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	checkObjectIDParam = require("../utils/common.js").checkObjectIDParam,
	smtp = require("../utils/smtp.js"),
	config = require("../utils/common.js").config,
	handleError = require("../utils/common.js").handleError,
	log = require("../utils/log.js");

module.exports = function(app, prefix){
	app.post(prefix + "/register",
		verifyRecaptcha,
	function(req, res){
		register(req.body)
		.then(function(user){
			smtp.sendEmailVerification(app, user, req.protocol + '://' + config.domain)
			.then(function(){
				res.status(201).send(user._id.toString());
			}).catch(function(err){
				res.status(500).end();
			});
		}).catch(function(){
			res.status(400).end();
		});
	});

	app.post(prefix + "/login",
	function(req, res){
		login(req.body.email, req.body.password)
		.then(function(jwt){
			res.send({token: jwt});
		});
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
		checkObjectIDParam("user"),
	function(req, res){
		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			return smtp.sendEmailVerification(app, user, req.protocol + '://' + config.domain);
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.post(prefix + "/:user/verify/:token",
		checkObjectIDParam("user"),
	function(req, res){
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
				Token.remove({token: req.params.token}).exec();
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
			thisUser.updateDirectory()
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
		checkObjectIDParam("user"),
	function(req, res){
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
		checkObjectIDParam("user"),
	function(req, res){
		var thisUser, responseData;
		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			thisUser = user;
			responseData = {
				email: thisUser.email,
				verified: thisUser.verified,
				created: thisUser.created,
				modified: thisUser.modified,
				accessed: thisUser.accessed,
				vip: thisUser.vip,
				lanInviteDesired: thisUser.lanInviteDesired,
				firstName: thisUser.firstName,
				lastName: thisUser.lastName,
				primaryHandle: thisUser.primaryHandle,
				tertiaryHandles: thisUser.tertiaryHandles,
				roles: thisUser.roles,
				services: thisUser.services
			};

			return req.user.hasRole("admin");
		}).then(function(rolePresent){
			if(rolePresent){
				responseData.__v = thisUser.__v;
				responseData._id = thisUser._id;
				responseData.blacklisted = thisUser.blacklisted;
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
		checkObjectIDParam("user"),
	function(req, res){
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

			return req.user.hasRole("admin");
		}).then(function(rolePresent){
			if(rolePresent){
				editUser.verified = req.body.verified;
				editUser.vip = req.body.vip;
				editUser.blacklisted = req.body.blacklisted;
				editUser.roles = removeDuplicates(req.body.roles);
				editUser.services = req.body.services;
			}
			editUser.save();
		}).then(function(){
			return editUser.syncWithDirectory();
		}).then(function(){
			return res.status(200).end();
		}).catch(handleError(res));
	});

	app.put(prefix + "/:user/password",
		authenticate,
		authorizeSessionUser(),
		checkObjectIDParam("user"),
	function(req, res){
		// Update the user
		var thisUser;
		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			thisUser = user;
			return req.user.hasRole("admin");
		}).then(function(rolePresent){
			if(rolePresent){
				return thisUser.resetPassword(req.body.newPassword);
			}else{
				return thisUser.changePassword(req.body.oldPassword, req.body.newPassword);
			}
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.post(prefix + "/:user/password/reset/:token",
		checkObjectIDParam("user"),
	function(req, res){
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

	app.post(prefix + "/:user/directory/sync",
		authenticate,
		authorizeSessionUser(),
		checkObjectIDParam("user"),
	function(req, res){
		if(!config.ldap.enabled){
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

	app.post(prefix + "/:user/directory/recreate",
		authenticate,
		authorize({hasRoles: ["admin"]}),
		checkObjectIDParam("user"),
	function(req, res){
		if(!config.ldap.enabled){
			return res.status(404).end();
		}

		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			return user.recreateInDirectory(req.body.password);
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.post(prefix + "/:user/directory/forceupdate",
		authenticate,
		authorize({hasRoles: ["admin"]}),
		checkObjectIDParam("user"),
	function(req, res){
		if(!config.ldap.enabled){
			return res.status(404).end();
		}

		User.findById(req.params.user)
		.then(function(user){
			if(!user) throw 404;
			return user.updateDirectory();
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});
};
