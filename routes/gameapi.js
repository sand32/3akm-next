/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2016 Seth Anderson

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
	Lan = require("../model/lan.js"),
	authorize = require("../authorization.js").authorize,
	authenticate = require("../utils/common.js").authenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB;

module.exports = function(app, prefix){
	app.get(prefix, 
	function(req, res){
		Game.find({})
		.exec(function(err, docs){
			if(err){
				res.status(500).end();
			}else{
				res.send(docs || []);
			}
		});
	});

	app.get(prefix + "/:game", 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.status(404).end();
		}
		Game.findById(req.params.game)
		.exec(function(err, doc){
			if(err){
				res.status(500).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.send(doc);
			}
		});
	});

	app.post(prefix, 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		var uniqueStores = [];
		for(var i = 0; i < req.body.stores.length; i += 1){
			if(!mongoose.Types.ObjectId.isValid(req.body.stores[i].store)){
				return res.status(400).end();
			}else if(uniqueStores.indexOf(req.body.stores[i].store) != -1){
				return res.status(400).end();
			}else{
				uniqueStores.push(req.body.stores[i].store);
			}
		}

		var game = new Game(req.body);
		game.save(function(err){
			if(err){
				res.status(400).end();
			}else{
				res.status(201)
				.location(prefix + "/" + game._id)
				.send({_id: game._id});
			}
		});
	});

	app.put(prefix + "/:game", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.status(404).end();
		}

		if(req.body.stores && Array.isArray(req.body.stores)){
			var uniqueStores = [];
			for(var i = 0; i < req.body.stores.length; i += 1){
				if(!mongoose.Types.ObjectId.isValid(req.body.stores[i].store)){
					return res.status(400).end();
				}else if(uniqueStores.indexOf(req.body.stores[i].store) != -1){
					return res.status(400).end();
				}else{
					uniqueStores.push(req.body.stores[i].store);
				}
			}
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

	app.delete(prefix + "/:game", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.status(404).end();
		}

		Lan.find({"games.game": req.params.game}, function(err, docs){
			if(!err && docs){
				for(var i = 0; i < docs.length; i += 1){
					for(var j = 0; j < docs[i].games.length; j += 1){
						if(docs[i].games[j].game.toString() == req.params.game){
							docs[i].games.splice(j, 1);
						}
					}
					docs[i].save();
				}
			}
		});
		Game.findByIdAndRemove(req.params.game, function(err, doc){
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
