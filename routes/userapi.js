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

var passport = require("passport"),
	mongoose = require("mongoose"),
	q = require("q"),
	User = require("../model/user.js"),
	Token = require("../model/token.js"),
	authorize = require("../authorization.js").authorize,
	authorizeSessionUser = require("../authorization.js").authorizeSessionUser,
	register = require("../utils/common.js").register,
	login = require("../utils/common.js").login,
	authenticate = require("../utils/common.js").authenticate,
	verifyRecaptcha = require("../utils/common.js").verifyRecaptcha,
	removeDuplicates = require("../utils/common.js").removeDuplicates,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	smtp = require("../utils/smtp.js"),
	config = require("../utils/common.js").config;

module.exports = function(app, prefix){
	app.post(prefix + "/register", 
		verifyRecaptcha, 
		register, 
	function(req, res){
		if(req.isAuthenticated()){
			// Send email for verification
			// Respond with "201 Created"
			res.status(201).send(req.user._id.toString());
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

	app.post(prefix + "/:user/verify", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		User.findById(req.params.user, function(err, doc){
			if(err){
				res.status(500).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				smtp.sendEmailVerification(app, doc, req.protocol + '://' + config.domain)
				.then(function(){
					res.status(200).end();
				}).catch(function(err){
					res.status(400).end();
				});
			}
		});
	});

	app.post(prefix + "/:user/verify/:token", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		var deferredUser = q.defer(), deferredToken = q.defer(),
			verified = false;
		User.findById(req.params.user, function(err, doc){
			if(err){
				deferredUser.reject({reason: "db-error", message: err});
			}else if(!doc){
				deferredUser.reject({reason: "not-found", message: "User not found"});
			}else{
				verified = doc.verified;
				deferredUser.resolve(doc);
			}
		});
		Token.findOne({token: req.params.token}, function(err, doc){
			if(err){
				deferredToken.reject({reason: "db-error", message: err});
			}else if(!doc){
				deferredToken.reject({reason: "not-found", message: "Token not found"});
			}else{
				deferredToken.resolve(doc);
			}
		});
		q.all([deferredUser.promise, deferredToken.promise])
		.spread(function(user, token){
			if(verified){
				res.status(200).end();
				return;
			}
			if(token.validate(user.email)){
				user.verified = true;
				user.modified = Date.now();
				user.save(function(err){
					if(err){
						console.error("Error: Successfully verified token for user \"" + user.email + "\", but failed to update flag");
						res.status(500).end();
					}else{
						user.syncWithDirectory()
						.then(function(){
							res.status(200).end();
						}).catch(function(err){
							console.error("Error: Successfully verified token for user \"" + user.email + "\", but failed to sync with directory");
							res.status(500).end();
						});
					}
				});
			}else{
				res.status(400).end();
			}
		}).catch(function(err){
			if(verified){
				res.status(200).end();
				return;
			}
			if(err.reason === "db-error"){
				res.status(500).end();
			}else if(err.reason === "not-found"){
				res.status(404).end();
			}else{
				res.status(400).end();
			}
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
		User.findById(req.params.user, function(err, doc){
			if(doc){
				res.status(200).send({verified: doc.verified});
			}else{
				res.status(404).end();
			}
		});
	});

	app.get(prefix, 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		User.find({}, function(err, docs){
			if(err){
				res.status(500).end();
			}else{
				res.send(docs || []);
			}
		});
	});

	app.get(prefix + "/:user", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}
		User.findById(req.params.user, function(err, doc){
			if(err){
				res.status(500).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				var responseData = {
					email: doc.email,
					verified: doc.verified,
					created: doc.created,
					modified: doc.modified,
					accessed: doc.accessed,
					vip: doc.vip,
					lanInviteDesired: doc.lanInviteDesired,
					firstName: doc.firstName,
					lastName: doc.lastName,
					primaryHandle: doc.primaryHandle,
					tertiaryHandles: doc.tertiaryHandles,
					roles: doc.roles,
					services: doc.services
				};

				if(req.user.hasRole("admin")){
					responseData.__v = doc.__v;
					responseData._id = doc._id;
					responseData.blacklisted = doc.blacklisted;
				}

				res.send(responseData);
			}
		});
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

		var deferredExistingUser = q.defer(), deferredEditUser = q.defer();
		User.findOne({email: req.body.email}, function(err, doc){
			if(err){
				deferredExistingUser.reject({reason: "db-error", message: err});
			}else if(doc){
				deferredExistingUser.reject({reason: "address-in-use", message: "User already using that email address"});
			}else{
				deferredExistingUser.resolve(doc);
			}
		});
		User.findById(req.params.user, function(err, doc){
			if(err){
				deferredEditUser.reject({reason: "db-error", message: err});
			}else if(!doc){
				deferredEditUser.reject({reason: "not-found", message: "User not found"});
			}else{
				deferredEditUser.resolve(doc);
			}
		});
		q.all([deferredExistingUser.promise, deferredEditUser.promise])
		.spread(function(existingUser, editUser){
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
			if(req.user.hasRole("admin")){
				editUser.verified = req.body.verified;
				editUser.vip = req.body.vip;
				editUser.blacklisted = req.body.blacklisted;
				editUser.roles = removeDuplicates(req.body.roles);
				editUser.services = req.body.services;
			}
			editUser.save(function(err){
				if(err){
					res.status(500).end();
				}else{
					editUser.syncWithDirectory()
					.then(function(){
						res.status(200).end();
					}).catch(function(){
						res.status(500).end();
					});
				}
			});
		}).catch(function(err){
			if(err.reason === "db-error"){
				res.status(500).end();
			}else if(err.reason === "address-in-use"){
				res.status(409).end();
			}else if(err.reason === "not-found"){
				res.status(404).end();
			}else{
				res.status(400).end();
			}
		});
	});

	app.put(prefix + "/:user/password", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		// Update the user 
		User.findById(req.params.user, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				doc.changePassword(req.body.oldPassword, req.body.newPassword)
				.then(function(){
					res.status(200).end();
				}).catch(function(){
					res.status(400).end();
				});
			}
		});
	});
}
