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

var passport = require("passport");

module.exports = {
	// Special authentication in order to support local sessions and basic auth 
	// on API routes.
	// 
	// Basically: if we have a local session, proceed, else require basic auth.
	blendedAuthenticate: function(req, res, next){
		if(req.isAuthenticated()){
			return next();
		}
		passport.authenticate("basic")(req, res, next);
	},

	getFormattedTime: function(date){
		var padTo2 = function(num){
			var string = num.toString();
			if(string.length < 2){
				string = "0" + string;
			}
			return string;
		};
		var dateString = date.getFullYear() + "-" + padTo2(date.getMonth()+1) + "-" + padTo2(date.getDate()) + " "
			+ (date.getHours()%12 === 0 ? "12" : padTo2(date.getHours()%12)) + ":" + padTo2(date.getMinutes()) + ":" + padTo2(date.getSeconds()) 
			+ " " + (date.getHours() > 12 ? "PM" : "AM");
		return dateString;
	},

	removeDuplicates: function(array){
		var newArray = [];
		for(var i = 0; i < array.length; i += 1){
			if(newArray.indexOf(array[i]) === -1){
				newArray.push(array[i]);
			}
		}
		return newArray;
	}
}
