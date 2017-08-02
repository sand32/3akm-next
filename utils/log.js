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

var es = require("elasticsearch"),
	fs = require("fs"),
	Promise = require("bluebird"),
	esClient = null,
	LogLevel = {
		Information: "Information",
		Warning: "Warning",
		Error: "Error"
	},

	loadConfig = function(file){
		return JSON.parse(fs.readFileSync(file, "utf8"));
	},

	config = loadConfig(__dirname + "/../config/config.json"),

	padLeft = function(str, padWith, to){
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
	},

	logStdout = function(errorObj, logLevelMessage){
		var timestamp = constructTimestamp(new Date());
		if(errorObj
		&& errorObj.reason){
			console.error(timestamp + " | " + logLevelMessage + ": " + errorObj.message);
		}else if(typeof errorObj === "string"){
			console.error(timestamp + " | " + logLevelMessage + ": " + errorObj);
		}
	},

	getElasticIndexName = function(){
		var currentDate = new Date();
		return config.elasticsearch.indexPrefix +
			currentDate.getFullYear().toString() +
			padLeft((currentDate.getMonth() + 1).toString(), "0", 2) +
			padLeft(currentDate.getDate().toString(), "0", 2);
	},

	createIndexIfNotExists = function(index){
		return esClient.indices.exists({index: index})
		.then(function(indexExists){
			if(!indexExists){
				return esClient.indices.create({index: index})
			}
		})
	},

	writeElastic = function(body, type){
		if(esClient){
			var index = getElasticIndexName();
			return createIndexIfNotExists(index)
			.then(function(){
				return esClient.index({
					index: index,
					type: type,
					body: body
				});
			}).then(function(response){
				logStdout(response, LogLevel.Information);
			}).catch(function(err){
				logStdout(err, LogLevel.Error);
			});
		}else{
			return Promise.resolve();
		}
	},

	logElastic = function(errorObj, logLevel){
		if(!config.elasticsearch.enabled){
			return;
		}

		var currentTime = new Date();
		var timestamp = constructTimestamp(currentTime);
		if(errorObj
		&& errorObj.reason){
			writeElastic({
				reason: errorObj.reason,
				message: errorObj.message
			}, logLevel);
		}else if(typeof errorObj === "string"){
			writeElastic({
				reason: "unknown",
				message: errorObj
			}, logLevel);
		}
	};

if(config.elasticsearch.enabled){
	esClient = new es.Client({
		host: config.elasticsearch.host
	});
}

module.exports = {
	log: function(errorObj){
		//logElastic(errorObj, LogLevel.Information);
		logStdout(errorObj, LogLevel.Information);
	},

	warn: function(errorObj){
		logElastic(errorObj, LogLevel.Warning);
		logStdout(errorObj, LogLevel.Warning);
	},

	error: function(errorObj){
		logElastic(errorObj, LogLevel.Error);
		logStdout(errorObj, LogLevel.Error);
	},

	writeElastic: writeElastic
};
