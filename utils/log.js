/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2017 Seth Anderson

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

var padLeft = function(str, padWith, to){
	if(typeof str !== "string"){
		console.error("ARGH!!!");
	}
	while(str.length < to){
		str = padWith + str;
	}
	return str;
},

constructTimestamp = function(date){
	return date.getFullYear().toString() + "/" +
		padLeft((date.getMonth() + 1).toString(), "0", 2) + "/" +
		padLeft(date.getDate().toString(), "0", 2) + " " +
		padLeft(date.getHours().toString(), "0", 2) + ":" +
		padLeft(date.getMinutes().toString(), "0", 2) + ":" +
		padLeft(date.getSeconds().toString(), "0", 2);
};

module.exports = {
	log: function(errorObj){
		var timestamp = constructTimestamp(new Date());
		if(errorObj
		&& errorObj.reason){
			console.error(timestamp + " | " + errorObj.message);
		}else if(typeof errorObj === "string"){
			console.error(timestamp + " | " + errorObj);
		}
	},

	warn: function(errorObj){
		var timestamp = constructTimestamp(new Date());
		if(errorObj
		&& errorObj.reason){
			console.error(timestamp + " | Warning: " + errorObj.message);
		}else if(typeof errorObj === "string"){
			console.error(timestamp + " | Warning: " + errorObj);
		}
	},

	error: function(errorObj){
		var timestamp = constructTimestamp(new Date());
		if(errorObj
		&& errorObj.reason){
			console.error(timestamp + " | Error: " + errorObj.message);
		}else if(typeof errorObj === "string"){
			console.error(timestamp + " | Error: " + errorObj);
		}
	}
};
