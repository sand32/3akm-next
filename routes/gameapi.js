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

var mongoose = require("mongoose"),
	Game = require("../model/game.js"),
	authorize = require("../authorization.js"),
	blendedAuthenticate = require("../utils.js").blendedAuthenticate;

module.exports = function(app, prefix){
	app.post(prefix, blendedAuthenticate, function(req, res){
		if(!authorize(req.user)){
			return res.status(403).end();
		}

		var game = new Game(req.body);
		game.save(function(err){
			if(err){
				res.status(400).end();
			}else{
				res.status(201)
				.location(prefix + "/" + game._id)
				.end();
			}
		});
	});

	app.get(prefix + "/:game", blendedAuthenticate, function(req, res){
		Game.findById(req.params.game)
		.exec(function(err, doc){
			if(doc){
				res.status(200).send(doc);
			}else{
				res.status(404).end();
			}
		});
	});

	app.put(prefix + "/:game", blendedAuthenticate, function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.status(404).end();
		}else if(!authorize(req.user)){
			return res.status(403).end();
		}

		// Apply the update
		Game.findByIdAndUpdate(req.params.game, req.body, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});
}
