/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2015 Seth Anderson

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
	request = require("request");

module.exports = {
	loadConfig: function(file){
		return JSON.parse(fs.readFileSync(file, "utf8"));
	},

	// Special authentication in order to support local sessions and basic auth 
	// on API routes.
	// 
	// Basically: if we have a local session, proceed, else require basic auth.
	blendedAuthenticate: function(req, res, next){
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
		var config = module.exports.loadConfig(__dirname + "/../config/config.json"),
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
					}else if(body["error-codes"].length > 1 || body["error-codes"][0] !== "missing-input-response"){
						console.error("Error: recaptcha request failed with the following error codes:\n" + JSON.stringify(body["error-codes"]));
						res.status(500).end();
					}else{
						res.status(400).end();
					}
				}else{
					res.status(500).end();
				}
			});
		}else{
			console.warn("Warning: reCAPTCHA secret not set, allowing all registration requests");
			next();
		}
	},

	getFormattedTime: function(date, excludeTime, forDateField){
		var padTo2 = function(num){
				var string = num.toString();
				if(string.length < 2){
					string = "0" + string;
				}
				return string;
			},
			dateString;
		if(!forDateField){
			dateString = date.getFullYear() + "-" + padTo2(date.getMonth()+1) + "-" + padTo2(date.getDate());
		}else{
			dateString = padTo2(date.getMonth()+1) + "/" + padTo2(date.getDate()) + "/" + date.getFullYear();
		}
		if(!excludeTime){
			dateString += " " + (date.getHours()%12 === 0 ? "12" : padTo2(date.getHours()%12)) + ":" 
			+ padTo2(date.getMinutes()) + ":" + padTo2(date.getSeconds()) 
			+ " " + (date.getHours() > 12 ? "PM" : "AM");
		}
		return dateString;
	},

	secondsToHumanReadableDuration: function(secondsDuration){
		var seconds = secondsDuration % 60,
			minutes = (secondsDuration / 60) % 60,
			hours = (secondsDuration / 3600) % 24,
			days = secondsDuration / 86400,
			string = "";
		if(days > 1){
			string += parseInt(days) + "d ";
		}
		if(hours > 1 || string !== ""){
			string += parseInt(hours) + "h ";
		}
		if(minutes > 1 || string !== ""){
			string += parseInt(minutes) + "m ";
		}
		if(seconds > 1 || string !== ""){
			string += parseInt(seconds) + "s";
		}else{
			string = "0s";
		}
		return string;
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

	getSortClassForHeader: function(sort, header){
		if(sort && sort.indexOf(header) !== -1){
			if(sort.indexOf("-") !== -1){
				return "sort-desc";
			}else{
				return "sort-asc";
			}
		}else{
			return "";
		}
	},

	getSortLinkForHeader: function(sort, header){
		if(sort && sort.indexOf(header) !== -1){
			if(sort.indexOf("-") !== -1){
				return header;
			}else{
				return "-" + header;
			}
		}else{
			return header;
		}
	}
}
