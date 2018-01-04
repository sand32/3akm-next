/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2018 Seth Anderson

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

var mongoose = require("mongoose"),
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

	checkObjectIDParam: function(objectIDParam){
		return function(req, res, next){
			if(!mongoose.Types.ObjectId.isValid(req.params[objectIDParam])){
				res.status(404).end();
			}else{
				next();
			}
		};
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

	arraysAreEqual: function(a, b){
		if(a.length !== b.length) return false;
		for(var i = 0; i < a.length; i+=1){
			if(a[i] !== b[i]) return false;
		}
		return true;
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
			}else if(err.reason && err.reason.indexOf("in-use") !== -1
				  || err.reason && err.reason.indexOf("duplicate") !== -1){
				res.status(409).end();
			}else{
				if(err.message){
					log.error(err.message);
				}else{
					log.error(err);
				}
				res.status(500).end();
			}
		};
	}
};
