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
	User = require("../model/user.js"),
	authorize = require("../authorization.js").authorize,
	authorizeSessionUser = require("../authorization.js").authorizeSessionUser,
	register = require("../utils/common.js").register,
	login = require("../utils/common.js").login,
	authenticate = require("../utils/common.js").authenticate,
	verifyRecaptcha = require("../utils/common.js").verifyRecaptcha,
	removeDuplicates = require("../utils/common.js").removeDuplicates,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB;

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

	app.get(prefix + "/verify/:user", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		User.findById(req.params.user, function(err, doc){
			if(doc){
				doc.verified = true;
				doc.save();
				res.status(200).end();
			}else{
				res.status(404).end();
			}
		});
	});

	app.post(prefix + "/login", 
		login, 
	function(req, res){
		if(req.isAuthenticated()){
			req.user.accessed = Date.now();
			req.user.save();
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
		// Resend verification email
		res.status(200).end();
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
		// Ignore the following fields unless sent by an admin
		if(!req.user.hasRole("admin")){
			delete req.body.verified;
			delete req.body.vip;
			delete req.body.blacklisted;
			delete req.body.roles;
			delete req.body.services;
		}else if(req.body.roles){
			req.body.roles = removeDuplicates(req.body.roles);
		}
		delete req.body.created;
		delete req.body.accessed;

		// Record this modification
		req.body.modified = Date.now();

		// User passwords cannot be changed using this route, 
		// /:user/password must be used instead
		delete req.body.passwordHash;

		// Update the user 
		User.findByIdAndUpdate(req.params.user, req.body, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				doc.saveToDirectory()
				.then(function(){
					res.status(200).end();
				}).catch(function(){
					res.status(500).end();
				});
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
