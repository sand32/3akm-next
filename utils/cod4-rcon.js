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

var dgram = require("dgram"),
	loadConfig = require("./common.js").loadConfig,
	shuffle = require("./common.js").shuffle,
	config = require("./common.js").config,
	log = require("./log.js"),
	gameinfo = loadConfig(__dirname + "/../config/cod4-gameinfo.json"),
	commandQueue = [];

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
			callback({reason: "socketerr", message: err});
		});
		socket.bind(0, null, function(){
			var buffer = _constructRconCommand(command);
			socket.send(buffer, 0, buffer.length, config.cod4.port, config.cod4.address, function(err, bytes){
				if(err){
					log.error(err);
				}
				setTimeout(function(){
					if(!responseReceived){
						callback({reason: "timeout", message: "Command timed out."});
					}
				}, config.cod4.commandTimeout);
			});
		});
	},

	_queueCommand = function(command, callback){
		commandQueue.push({command: command, callback: callback});
	},

	_executeQueuedCommand = function(){
		var cmd;
		if(commandQueue.length > 0){
			cmd = commandQueue.shift();
			_sendAndReceiveSingleCommand(cmd.command, cmd.callback);
		}
	};

setInterval(_executeQueuedCommand, config.cod4.sequenceDelayMS);

module.exports = {
	raw: function(command, callback){
		_queueCommand(command, callback);
	},

	status: function(callback){
		_queueCommand("status", function(err, data){
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
					if(lines[i].substring(0, 3).trim() !== ""){
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
			}
			callback(null, dataObj);
		});
	},

	gametype: function(callback){
		_queueCommand("g_gametype", function(err, data){
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
					dataObj.gametype = tokens[2].replace("\"", "").replace("^7\"", "");
					dataObj.defaultGametype = tokens[4].replace("\"", "").replace("^7\"", "");
				}else if(lines[i].indexOf("latched") !== -1){
					tokens = lines[i].split(" ");
					dataObj.latched = tokens[1].replace("\"", "").replace("\"", "");
				}
			}
			callback(null, dataObj);
		});
	},

	setGametype: function(gametype, callback){
		if(!gametype){
			callback(new Error("Invalid gametype!"));
			return;
		}
		var dataObj = {}, mapRotation = "", 
			mapRotation, configFile, maplist;
		gametype = gametype.toLowerCase();

		// Verify given gametype is valid
		if(gameinfo.gametypes.indexOf(gametype) === -1){
			callback(new Error("Invalid gametype!"));
			return;
		}

		// Randomize and construct map rotation
		maplist = shuffle(gameinfo.maps);
		for(var i = 0; i < maplist.length; i += 1){
			if(i !== 0){
				mapRotation += " ";
			}
			mapRotation += "gametype " + gametype + " map " + maplist[i];
		}
		configFile = gametype + ".cfg";

		dataObj.latched = gametype;
		dataObj.mapRotation = maplist;

		// Send our first command
		_queueCommand("set g_gametype \"" + gametype + "\"", function(err, data){
			if(err){
				callback(err);
			}else{
				_queueCommand("exec " + configFile, function(err, data){
					if(err){
						callback(err);
					}else{
						_queueCommand("set sv_mapRotationCurrent \"" + mapRotation + "\"", function(err, data){
							if(err){
								callback(err);
							}else{
								callback(null, dataObj);
							}
						});
					}
				});
			}
		});
	},

	mapRotation: function(callback){
		_queueCommand("sv_mapRotationCurrent", function(err, data){
			if(err){
				callback(err);
				return;
			}
			var dataObj = {
					rotation: []
				},
				lines = data.replace("\r", "").split("\n"),
				mapRotation, gametype, map, state;
			for(var i = 0; i < lines.length; i += 1){
				if(lines[i].indexOf("sv_mapRotationCurrent") !== -1){
					mapRotation = lines[i].substring(29, lines[i].indexOf("^7"));
					mapRotation = mapRotation.split(" ");
					for(var j = 0; j < mapRotation.length; j += 1){
						if(mapRotation[j] === "gametype"){
							state = mapRotation[j];
							if(gametype){
								dataObj.rotation.push({
									gametype: gametype,
									map: map
								});
							}
						}else if(mapRotation[j] === "map"){
							state = mapRotation[j];
						}else if(state === "gametype"){
							gametype = mapRotation[j];
						}else if(state === "map"){
							map = mapRotation[j];
						}
					}
					dataObj.rotation.push({
						gametype: gametype,
						map: map
					});
					break;
				}
			}
			callback(null, dataObj);
		});
	},

	rotateMap: function(callback){
		_queueCommand("map_rotate", function(err, data){
			if(err){
				callback(err);
				return;
			}
			callback();
		});
	},

	say: function(message, callback){
		_queueCommand("say \"" + message + "\"", function(err, data){
			if(err){
				callback(err);
				return;
			}
			callback();
		});
	}
};
