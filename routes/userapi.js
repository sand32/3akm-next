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
	User = require("../model/user.js");

module.exports = function(app, prefix){
	app.post(prefix + "/register", passport.authenticate("register"), function(req, res){
		if(req.isAuthenticated()){
			// Send email for verification
			// Respond with "201 Created"
			res.send(201, req.user._id.toString());
		}else{
			res.send(403);
		}
	});

	app.get(prefix + "/verify/:verificationHash", function(req, res){
		if(req.verificationHash === req.user._id.toString()){
			User.update({_id: req.verificationHash}, {verified: true}, null, function(err){
				console.log(err);
			});
		}
	});

	app.post(prefix + "/login", passport.authenticate("login"), function(req, res){
		if(req.isAuthenticated()){
			res.send(200, {
				email: req.user.email,
				fullname: req.user.fullname,
				verified: req.user.verified
			});
		}
	});
}

