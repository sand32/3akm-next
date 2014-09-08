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
	blendedAuthenticate = require("../../utils/common.js").blendedAuthenticate;

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

	app.get(prefix + "/maplist", function(req, res){
		res.status(501).end();
	});

	app.get(prefix + "/maprotation", function(req, res){
		res.status(501).end();
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

	app.put(prefix + "/gametype", function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}
		res.status(501).end();
	});
}