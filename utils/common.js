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

var passport = require("passport"),
	querystring = require("querystring"),
	fs = require("fs"),
	request = require("request"),
	log = require("./log.js"),

	loadConfig = function(file){
		return JSON.parse(fs.readFileSync(file, "utf8"));
	},

	isNumeric = function(input){
		var RE = /^-{0,1}\d*\.{0,1}\d+$/;
		return (RE.test(input));
	};

module.exports = {
	loadConfig: loadConfig,

	config: loadConfig(__dirname + "/../config/config.json"),

	version: loadConfig(__dirname + "/../package.json").version,

	register: function(req, res, next){
		passport.authenticate("register", function(err, user, info){
			if(err && err.reason === "invalid-password"){
				return res.status(400).end();
			}else if(err){
				return res.status(500).end();
			}else{
				req.login(user, function(err){
					if(err){
						return next(err);
					}
					return next();
				});
			}
		})(req, res, next);
	},

	login: function(req, res, next){
		passport.authenticate("local")(req, res, next);
	},

	authenticate: function(req, res, next){
		module.exports.localElseBasicAuthenticate(req, res, next);
	},

	// Special authentication in order to support local sessions and basic auth 
	// on API routes.
	// 
	// Basically: if we have a local session, proceed, else require basic auth.
	localElseBasicAuthenticate: function(req, res, next){
		if(req.isAuthenticated()){
			return next();
		}
		if(req.params.user !== "session"){
			passport.authenticate("basic")(req, res, next);
		}else{
			res.status(403).end();
		}
	},

	verifyRecaptcha: function(req, res, next){
		var config = module.exports.config,
			url = "https://www.google.com/recaptcha/api/siteverify",
			data = querystring.stringify({
				secret: config.recaptchaSecret,
				response: req.body.recaptchaResponse
			});

		if(config.recaptchaSecret !== "changeme"){
			request.get(url + "?" + data, function(err, recaptchaResponse, body){
				if(!err){
					body = JSON.parse(body);
					if(body.success){
						next();
					}else if(body["error-codes"] && (body["error-codes"].length > 1 || body["error-codes"][0] !== "missing-input-response")){
						log.error("recaptcha request failed with the following error codes:\n" + JSON.stringify(body["error-codes"]));
						res.status(500).end();
					}else{
						res.status(400).end();
					}
				}else{
					res.status(500).end();
				}
			});
		}else{
			log.warn("reCAPTCHA secret not set, allowing all registration requests");
			next();
		}
	},

	sanitizeBodyForDB: function(req, res, next){
		if(req.body.__v) delete req.body.__v;
		if(req.body._id) delete req.body._id;
		next();
	},

	removeDuplicates: function(array){
		if(!array || !Array.isArray(array)){
			return array;
		}
		var newArray = [];
		for(var i = 0; i < array.length; i += 1){
			if(newArray.indexOf(array[i]) === -1){
				newArray.push(array[i]);
			}
		}
		return newArray;
	},

	shuffle: function(array){
		var counter = array.length, temp, index;

		// While there are elements in the array
		while(counter > 0){
			// Pick a random index
			index = Math.floor(Math.random() * counter);

			// Decrease counter by 1
			counter -= 1;

			// And swap the last element with it
			temp = array[counter];
			array[counter] = array[index];
			array[index] = temp;
		}
		return array;
	},

	handleError: function(res){
		return function(err){
			if(isNumeric(err)){
				return res.status(parseInt(err)).end();
			}
			if(err.status){
				return res.status(err.status).end();
			}
			if(err.reason === "bad-request"){
				res.status(400).end();
			}else if(err.reason && err.reason.indexOf("not-found") !== -1){
				res.status(404).end();
			}else if(err.reason && err.reason.indexOf("in-use") !== -1){
				res.status(409).end();
			}else{
				res.status(500).end();
			}
		};
	}
};
