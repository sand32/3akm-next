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
	User = require("../model/user.js");

module.exports = function(app, prefix){
	app.post(prefix + "/register", passport.authenticate("register"), function(req, res){
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

	resendVerification = function(req, res){
		if(req.params.user){
			if(!mongoose.Types.ObjectId.isValid(req.params.user)){
				return res.status(404).end();
			}else if(req.user._id != req.params.user
				  && !req.user.hasRole("admin")){
				return res.status(403).end();
			}
		}else{
			if(!req.isAuthenticated()){
				return res.status(403).end();
			}
		}

		// Resend verification email
		res.status(200).end();
	};
	app.post(prefix + "/session/verify", resendVerification);
	app.post(prefix + "/:user/verify", passport.authenticate("basic"), resendVerification);

	userIsVerified = function(req, res){
		if(req.params.user){
			if(!mongoose.Types.ObjectId.isValid(req.params.user)){
				return res.status(404).end();
			}else if(req.user._id != req.params.user
				  && !req.user.hasRole("admin")){
				return res.status(403).end();
			}
		}else{
			if(!req.isAuthenticated()){
				return res.status(403).end();
			}
		}

		User.findById(req.user._id, function(err, doc){
			if(doc){
				res.status(200).send({verified: doc.verified});
			}else{
				res.status(500).end();
			}
		});
	};
	app.get(prefix + "/session/verified", userIsVerified);
	app.get(prefix + "/:user/verified", passport.authenticate("basic"), userIsVerified);
}

