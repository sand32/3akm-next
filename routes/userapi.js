/*
-----------------------------------------------------------------------------
Copyright (c) 2014 Seth Anderson

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
	authorize = require("../authorization.js"),
	blendedAuthenticate = require("../utils/common.js").blendedAuthenticate,
	removeDuplicates = require("../utils/common.js").removeDuplicates;

module.exports = function(app, prefix){
	app.post(prefix + "/register", passport.authenticate("register"), function(req, res){
		if(req.isAuthenticated()){
			req.user.firstName = req.body.firstName;
			req.user.lastName = req.body.lastName;
			req.user.primaryHandle = req.body.primaryHandle;
			req.user.tertiaryHandles = req.body.tertiaryHandles;
			req.user.save();
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

	app.post(prefix + "/login", passport.authenticate("local"), function(req, res){
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

	app.post(prefix + "/:user/verify", blendedAuthenticate, function(req, res){
		var queryUser = req.params.user;
		if(req.params.user === "session"){
			queryUser = req.user._id;
		}else if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		// Only the user in the URL can access this resource
		if(!authorize(req.user, {isUser: queryUser})){
			return res.status(403).end();
		}

		// Resend verification email
		res.status(200).end();
	});

	app.get(prefix + "/:user/verified", blendedAuthenticate, function(req, res){
		var queryUser = req.params.user;
		if(req.params.user === "session"){
			queryUser = req.user._id;
		}else if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		// Only the user in the URL can access this resource
		if(!authorize(req.user, {isUser: queryUser})){
			return res.status(403).end();
		}

		// Retrieve and return the "verified" value
		User.findById(queryUser, function(err, doc){
			if(doc){
				res.status(200).send({verified: doc.verified});
			}else{
				res.status(404).end();
			}
		});
	});

	app.post(prefix, function(req, res){
		var user = new User();
		user.email = req.body.email;
		user.passwordHash = user.hash(req.body.password);
		user.firstName = req.body.firstName;
		user.lastName = req.body.lastName;
		user.primaryHandle = req.body.primaryHandle;
		user.tertiaryHandles = req.body.tertiaryHandles;
		user.lanInviteDesired = req.body.lanInviteDesired;

		if(req.isAuthenticated() && req.user.hasRole("admin")){
			user.vip = req.body.vip;
			user.blacklisted = req.body.blacklisted;
			user.roles = removeDuplicates(req.body.roles);
			user.services = req.body.services;
		}
		user.save(function(err){
			if(err){
				res.status(400).end();
			}else{
				res.status(201)
				.location(prefix + "/" + user._id)
				.send({_id: user._id});
			}
		});
	});

	app.get(prefix + "/:user", blendedAuthenticate, function(req, res){
		var queryUser = req.params.user;
		if(req.params.user === "session"){
			queryUser = req.user._id;
		}else if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		// Only the user in the URL can access this resource
		if(!authorize(req.user, {isUser: queryUser})){
			return res.status(403).end();
		}

		User.findById(queryUser, function(err, doc){
			if(doc){
				res.status(200).send({
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
				});
			}else{
				res.status(404).end();
			}
		});
	});

	app.put(prefix + "/:user", blendedAuthenticate, function(req, res){
		var queryUser = req.params.user;
		if(req.params.user === "session"){
			queryUser = req.user._id;
		}else if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		// Only the user in the URL can access this resource
		if(!authorize(req.user, {isUser: queryUser})){
			return res.status(403).end();
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
		delete req.body.passwordHash;
		delete req.body.created;
		delete req.body.accessed;

		// Record this modification
		req.body.modified = Date.now();

		// Update the user 
		User.findByIdAndUpdate(queryUser, req.body, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});

	app.put(prefix + "/:user/password", blendedAuthenticate, function(req, res){
		var queryUser = req.params.user;
		if(req.params.user === "session"){
			queryUser = req.user._id;
		}else if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		// Only the user in the URL can access this resource
		if(!authorize(req.user, {isUser: queryUser})){
			return res.status(403).end();
		}

		// Record this modification
		var update = {
			modified: Date.now(),
			passwordHash: req.user.hash(req.body.password)
		}

		// Update the user 
		User.findByIdAndUpdate(queryUser, update, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});
}
