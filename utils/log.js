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
