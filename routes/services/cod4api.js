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

var cod4 = require("../../utils/cod4-rcon.js"),
	authorize = require("../../authorization.js"),
	blendedAuthenticate = require("../../utils/common.js").blendedAuthenticate,
	loadConfig = require("../../utils/common.js").loadConfig,
	gameinfo = loadConfig(__dirname + "/../../config/cod4-gameinfo.json");

module.exports = function(app, prefix){
	app.get(prefix + "/currentmap", function(req, res){
		cod4.status(function(err, data){
			if(!err){
				res.status(200).send({
					map: data.map
				});
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});

	app.put(prefix + "/currentmap", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		res.status(501).end();
	});

	app.get(prefix + "/status", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		cod4.status(function(err, data){
			if(!err){
				res.status(200).send(data);
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});

	app.post(prefix + "/rotate", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		cod4.rotateMap(function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});

	app.get(prefix + "/maprotation", function(req, res){
		cod4.mapRotation(function(err, data){
			if(!err){
				res.status(200).send(data);
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});

	app.get(prefix + "/maps", function(req, res){
		res.status(200).send(gameinfo.maps);
	});

	app.get(prefix + "/gametypes", function(req, res){
		res.status(200).send(gameinfo.gametypes);
	});

	app.get(prefix + "/gametype", function(req, res){
		cod4.gametype(function(err, data){
			if(!err){
				res.status(200).send({
					gametype: data.gametype,
					defaultGametype: data.defaultGametype,
					latched: data.latched || ""
				});
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});

	app.put(prefix + "/gametype", blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		cod4.setGametype(req.body.gametype, function(err, data){
			if(!err){
				res.status(200).send(data);
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});
}