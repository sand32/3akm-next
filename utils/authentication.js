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

var jwt = require("jsonwebtoken"),
    config = require("./common.js").config,
    User = require("../model/user.js");

module.exports = {
    register: function(userTemplate){
        // Delete all fields that cannot be submitted by an anonymous user
        delete userTemplate.verified;
        delete userTemplate.vip;
        delete userTemplate.blacklisted;
        delete userTemplate.roles;
        delete userTemplate.services;
        delete userTemplate.passwordHash;
        delete userTemplate.created;
        delete userTemplate.modified;
        delete userTemplate.accessed;
        return User.createNew(userTemplate);
    },

    login: function(username, password){
        return User.authenticate(username, password)
        .then(function(user){
            var jwtOptions = {
                algorithm: "HS256",
                expiresIn: config.jwtExpiry,
                audience: "3akm",
                issuer: "3akm",
                subject: user._id.toString()
            };
            return jwt.sign({roles: user.roles}, config.jwtSecret, jwtOptions);
        });
    },

    authenticate: function(req, res, next){
        var authHeader = req.get("Authorization");
        if(!authHeader){
            res.status(401).end();
            return;
        }

        var token = authHeader.split(" ")[1];
        jwt.verify(token, config.jwtSecret, null, function(err, decoded){
            if(err){
                res.status(401).end();
                return;
            }
            User.findById(decoded.sub)
            .then(function(user){
                req.user = user;
                next();
            }).catch(function(){
                res.status(401).end();
            });
        });
    }
};
