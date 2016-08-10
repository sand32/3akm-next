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

module.exports = function(){
	var passport = require("passport"),
		BasicStrategy = require("passport-http").BasicStrategy,
		LocalStrategy = require("passport-local"),
		User = require("./model/user.js"),
		Ldap = require("./utils/ldap.js");

	passport.serializeUser(function(user, done){
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done){
		User.findById(id, function(err, user){
			done(err, user);
		});
	});

	passport.use("register", new LocalStrategy({
			usernameField: "email",
			passwordField: "password",
			passReqToCallback: true
		},
		function(req, email, password, done){
			process.nextTick(function(){
				// Delete all fields that cannot be submitted by an anonymous user
				delete req.body.verified;
				delete req.body.vip;
				delete req.body.blacklisted;
				delete req.body.roles;
				delete req.body.services;
				delete req.body.passwordHash;
				delete req.body.created;
				delete req.body.modified;
				delete req.body.accessed;

				User.createNew(req.body)
				.then(function(newUser){
					done(null, newUser);
				}).catch(function(err){
					done(err);
				});
			});
		}
	));

	passport.use("local", new LocalStrategy({
			usernameField: "email",
			passwordField: "password"
		},
		function(email, password, done){
			process.nextTick(function(){
				User.authenticate(email, password)
				.then(function(user){
					done(null, user);
				}).catch(function(err){
					done(err.message);
				});
			});
		}
	));

	passport.use("basic", new BasicStrategy(
		function(email, password, done){
			process.nextTick(function(){
				User.authenticate(email, password)
				.then(function(user){
					done(null, user);
				}).catch(function(err){
					done(err.message);
				});
			});
		}
	));
};
