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

var cod4 = require("../../utils/cod4-rcon.js"),
	authorize = require("../../authorization.js").authorize,
	authenticate = require("../../utils/common.js").authenticate,
	loadConfig = require("../../utils/common.js").loadConfig,
	gameinfo = loadConfig(__dirname + "/../../config/cod4-gameinfo.json");

module.exports = function(app, prefix){
	app.get(prefix + "/maps", function(req, res){
		res.send(gameinfo.maps);
	});

	app.get(prefix + "/map", function(req, res){
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

	app.put(prefix + "/map", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		res.status(501).end();
	});

	app.post(prefix + "/map/rotate", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		cod4.rotateMap(function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});

	app.get(prefix + "/status", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		cod4.status(function(err, data){
			if(!err){
				res.status(200).send(data);
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});

	app.get(prefix + "/maprotation", function(req, res){
		cod4.mapRotation(function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});

	app.get(prefix + "/gametypes", function(req, res){
		res.status(200).send(gameinfo.gametypes);
	});

	app.get(prefix + "/gametype", function(req, res){
		cod4.gametype(function(err, data){
			if(!err){
				res.send({
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

	app.put(prefix + "/gametype", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		cod4.setGametype(req.body.gametype, function(err, data){
			if(!err){
				res.send(data);
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});

	app.post(prefix + "/say", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		cod4.say(req.body.message, function(err, data){
			if(!err){
				res.status(200).end();
			}else{
				res.status(500).end();
				console.log("Error: " + err.message);
			}
		});
	});
}