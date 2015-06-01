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

var mongoose = require("mongoose"),
	q = require("q"),
	Lan = require("../model/lan.js"),
	Game = require("../model/game.js"),
	authorize = require("../authorization.js").authorize,
	blendedAuthenticate = require("../utils/common.js").blendedAuthenticate;

module.exports = function(app, prefix){
	app.get(prefix + "/:lan", 
	function(req, res){
		if(req.params.lan === "next"){
			Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}})
			.populate("games.game")
			.exec(function(err, doc){
				if(err || !doc){
					res.status(500).end();
				}else{
					res.status(200).send(doc);
				}
			});
		}else{
			Lan.findById(req.params.lan)
			.populate("games.game")
			.exec(function(err, doc){
				if(err){
					res.status(500).end();
				}else if(!doc){
					res.status(404).end();
				}else{
					res.status(200).send(doc);
				}
			});
		}
	});

	app.get(prefix + "/:lan/games", 
	function(req, res){
		var deferred = q.defer(),
			year;
		if(req.params.lan === "next"){
			Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}})
			.exec(function(err, doc){
				if(err || !doc){
					deferred.reject(err);
				}else{
					year = doc.beginDate.getFullYear();
					deferred.resolve(doc.games);
				}
			});
		}else{
			Lan.findById(req.params.lan)
			.exec(function(err, doc){
				if(err){
					deferred.reject(err);
				}else if(!doc){
					res.status(404).end();
				}else{
					year = doc.beginDate.getFullYear();
					deferred.resolve(doc.games);
				}
			});
		}

		deferred.promise.then(function(data){
			var gameIds = [];
			for(var i = 0; i < data.length; i += 1){
				gameIds.push(data[i].game);
			}
			Game.find({_id: {$in: gameIds}})
			.populate("stores.store")
			.exec(function(err, docs){
				if(err){
					res.status(500).end();
				}else{
					res.send({
						year: year,
						games: docs
					});
				}
			});
		}, function(err){
			res.status(500).end();
		});
	});

	app.post(prefix, 
		blendedAuthenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		var lan = new Lan(req.body);
		lan.save(function(err){
			if(err){
				res.status(400).end();
			}else{
				res.status(201)
				.location(prefix + "/" + lan._id)
				.end();
			}
		});
	});

	app.put(prefix + "/:lan", 
		blendedAuthenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.lan)){
			return res.status(404).end();
		}

		// Apply the update
		Lan.findByIdAndUpdate(req.params.lan, req.body, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});

	app.delete(prefix + "/:lan", 
		blendedAuthenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.lan)){
			return res.status(404).end();
		}

		Lan.findByIdAndRemove(req.params.lan, function(err, doc){
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
