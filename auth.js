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

module.exports = function(){
	var possport = require("passport"),
		BasicStrategy = require("passport-http").BasicStrategy,
		LocalStrategy = require("passport-local"),
		User = require("./model/user.js");

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
			passwordField: "password"
		},
		function(req, email, password, done){
			process.nextTick(function(){
				// Try to find a user with the given email
				User.findOne({"email": email}, function(err, user){
					// If we've encountered a database error, bail
					if(err){
						return done(err);
					}

					// If we'ver found the email in our database, the user already exists, do nothing
					if(user){
						return done(null, false);
					// Else, create the new user
					}else{
						var newUser = new User();
						newUser.email = email;
						newUser.pass = newUser.hash(password);
						newUser.save(function(err){
							if(err){
								throw err;
							}
							return done(null, newUser);
						});
					}
				});
			});
		}
	));

	passport.use("login", new LocalStrategy({
			usernameField: "email",
			passwordField: "password"
		},
		function(req, email, password, done){
			process.nextTick(function(){
				// Try to find a user with the given email
				User.findOne({"email": email}, function(err, user){
					// If we've encountered a database error, bail
					if(err){
						return done(err);
					}

					// If we've found the user in the database and the given password matches, 
					// pass the user on to the next middleware
					if(user && user.isValidPassword(password)){
						return done(null, user);
					// Else, set the flash and move on
					}else{
						return done(null, false);
					}
				});
			});
		}
	));

	passport.use("api", new BasicStrategy(
		function(email, password, done){
			process.nextTick(function(){
				// Try to find a user with the given email
				User.findOne({"email": email}, function(err, user){
					// If we've encountered a database error, bail
					if(err){
						return done(err);
					}

					// If we've found the user in the database and the given password matches, 
					// pass the user on to the next middleware
					if(user && user.isValidPassword(password)){
						return done(null, user);
					// Else, set the flash and move on
					}else{
						return done(null, false);
					}
				});
			});
		}
	));
}

