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

var dgram = require("dgram"),
	loadConfig = require("./common.js").loadConfig,
	config = loadConfig(__dirname + "/../config.json"),

	_constructRconCommand = function(command){
		var buffer = new Buffer(config.cod4.password.length + command.length + 12);
		buffer.writeUInt32LE(0xffffffff, 0);
		buffer.writeUInt8(0x02, 4);
		buffer.writeUInt8("r".charCodeAt(0), 5);
		buffer.writeUInt8("c".charCodeAt(0), 6);
		buffer.writeUInt8("o".charCodeAt(0), 7);
		buffer.writeUInt8("n".charCodeAt(0), 8);
		buffer.writeUInt8(" ".charCodeAt(0), 9);
		buffer.write(config.cod4.password, 10);
		buffer.writeUInt8(" ".charCodeAt(0), 10 + config.cod4.password.length);
		buffer.write(command, 11 + config.cod4.password.length);
		buffer.writeUInt8("\n".charCodeAt(0), buffer.length - 1);
		return buffer;
	},

	_sendAndReceiveSingleCommand = function(command, callback){
		var socket = dgram.createSocket("udp4"),
			responseReceived = false;
		socket.on("message", function(data){
			callback(null, data.toString().replace("����", ""));
			responseReceived = true;
			socket.close();
		})
		.on("error", function(err){
			callback(new Error(err));
		});
		socket.bind(0, null, function(){
			var buffer = _constructRconCommand(command);
			socket.send(buffer, 0, buffer.length, config.cod4.port, config.cod4.address, function(err, bytes){
				if(err){
					console.log(err);
				}
				setTimeout(function(){
					if(!responseReceived){
						callback(new Error("Command timed out."));
					}
				}, config.cod4.commandTimeout);
			});
		});
	};

module.exports = {
	raw: function(command, callback){
		_sendAndReceiveSingleCommand(command, callback);
	},

	status: function(callback){
		_sendAndReceiveSingleCommand("status", function(err, data){
			if(err){
				callback(err);
				return;
			}
			var dataObj = {},
				lines = data.replace("\r", "").split("\n"),
				tokens, inList = false;
			for(var i = 0; i < lines.length; i += 1){
				if(lines[i].indexOf("map:") !== -1){
					tokens = lines[i].split(": ");
					dataObj.map = tokens[1];
				}else if(lines[i].indexOf("--- -----") !== -1){
					inList = true;
					dataObj.players = [];
				}else if(inList === true){
					dataObj.players.push({
						num: lines[i].substring(0, 3),
						score: lines[i].substring(4, 9),
						ping: lines[i].substring(10, 14),
						guid: lines[i].substring(15, 47),
						name: lines[i].substring(48, 63),
						lastmsg: lines[i].substring(64, 71),
						address: lines[i].substring(72, 93),
						qport: lines[i].substring(94, 99),
						rate: lines[i].substring(100)
					});
				}
			}
			callback(null, dataObj);
		});
	},

	gametype: function(callback){
		_sendAndReceiveSingleCommand("g_gametype", function(err, data){
			if(err){
				callback(err);
				return;
			}
			var dataObj = {},
				lines = data.replace("\r", "").split("\n"),
				tokens;
			for(var i = 0; i < lines.length; i += 1){
				if(lines[i].indexOf("\"g_gametype\"") !== -1){
					tokens = lines[i].split(" ");
					dataObj.gametype = tokens[2].replace("\"", "").replace("^7", "");
					dataObj.defaultGametype = tokens[4].replace("\"", "").replace("^7", "");
				}else if(lines[i].indexOf("latched") !== -1){
					tokens = lines[i].split(" ");
					dataObj.latched = tokens[1].replace("\"", "");
				}
			}
		});
	}
}
