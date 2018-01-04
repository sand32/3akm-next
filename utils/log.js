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
