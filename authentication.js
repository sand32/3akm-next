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
