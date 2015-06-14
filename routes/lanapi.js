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
	Rsvp = require("../model/rsvp.js"),
	authorize = require("../authorization.js").authorize,
	blendedAuthenticate = require("../utils/common.js").blendedAuthenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB;;

module.exports = function(app, prefix){
	app.get(prefix,
	function(req, res){
		Lan.find({})
		.exec(function(err, docs){
			if(err){
				res.status(500).end();
			}else{
				res.send(docs || []);
			}
		});
	});

	app.get(prefix + "/:lan", 
	function(req, res){
		var query = null;
		if(req.params.lan === "current"){
			query = Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}});
		}else if(req.params.lan === "next"){
			query = Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}});
			query.where("beginDate").gt(Date.now());
		}else{
			query = Lan.findById(req.params.lan);
		}

		query.exec(function(err, doc){
			if(err){
				res.status(500).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.send(doc);
			}
		});
	});

	app.get(prefix + "/:lan/games", 
	function(req, res){
		var deferred = q.defer(),
			query = null,
			year;
		if(req.params.lan === "current"){
			query = Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}});
		}else if(req.params.lan === "next"){
			query = Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}});
			query.where("beginDate").gt(Date.now());
		}else{
			query = Lan.findById(req.params.lan);
		}
		query.exec(function(err, doc){
			if(err){
				deferred.reject(err);
			}else if(!doc){
				res.status(404).end();
			}else{
				year = doc.beginDate.getFullYear();
				deferred.resolve(doc.games);
			}
		});

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

	app.get(prefix + "/:lan/rsvps", 
	function(req, res){
		var deferred = q.defer(),
			query = null,
			year;
		if(req.params.lan === "current"){
			query = Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}});
		}else if(req.params.lan === "next"){
			query = Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}});
			query.where("beginDate").gt(Date.now());
		}else{
			query = Lan.findById(req.params.lan);
		}
		query.exec(function(err, doc){
			if(err){
				deferred.reject(err);
			}else if(!doc){
				res.status(404).end();
			}else{
				year = doc.beginDate.getFullYear();
				deferred.resolve(doc);
			}
		});

		deferred.promise.then(function(data){
			Rsvp.find({lan: data._id})
			.populate("user tournaments.game", "email firstName lastName primaryHandle name")
			.exec(function(err, docs){
				if(err){
					res.status(500).end();
				}else{
					var rsvps = JSON.parse(JSON.stringify(docs));
					for(var i = 0; i < rsvps.length; i += 1){
						for(var j = 0; j < rsvps[i].tournaments.length; j += 1){
							for(var k = 0; k < data.games.length; k += 1){
								if(data.games[k].game.toString() === rsvps[i].tournaments[j].game._id.toString()){
									rsvps[i].tournaments[j].game.tournamentName = data.games[k].tournamentName;
									rsvps[i].tournaments[j].game.tournament = data.games[k].tournament;
								}
							}
						}
					}
					res.send(rsvps);
				}
			});
		}, function(err){
			res.status(500).end();
		});
	});

	app.post(prefix, 
		blendedAuthenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		var lan = new Lan(req.body);
		lan.save(function(err){
			if(err){
				res.status(400).end();
			}else{
				res.status(201)
				.location(prefix + "/" + lan._id)
				.send({_id: lan._id});
			}
		});
	});

	app.put(prefix + "/:lan", 
		blendedAuthenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
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
