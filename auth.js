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
            passwordField: "pass"
        },
        function(req, email, password, done){
            process.nextTick(function(){
                User.findOne({"email": email}, function(err, user){
                    if(err){
                        return done(err);
                    }

                    if(user){
                        return done(null, false, req.flash("registerResponse", "A user with that email already exists."));
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
            passwordField: "pass"
        },
        function(req, email, password, done){
            process.nextTick(function(){
                User.findOne({"email": email}, function(err, user){
                    if(err){
                        return done(err);
                    }

                    if(user && user.isValidPassword(user.pass)){
                        return done(null, user);
                    }else{
                        return done(null, false, req.flash("loginResponse", "Invalid email or password."));
                    }
                });
            });
        }
    ));
}

