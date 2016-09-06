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
	Promise = require("bluebird"),
	Lan = require("../model/lan.js"),
	Game = require("../model/game.js"),
	Rsvp = require("../model/rsvp.js"),
	User = require("../model/user.js"),
	authorize = require("../authorization.js").authorize,
	authenticate = require("../utils/common.js").authenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	shuffle = require("../utils/common.js").shuffle,
	handleError = require("../utils/common.js").handleError,
	log = require("../utils/log.js"),

	getLANQuery = function(id){
		if(id === "current"){
			query = Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}});
		}else if(id === "next"){
			query = Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}});
			query.where("beginDate").gt(Date.now());
		}else if(mongoose.Types.ObjectId.isValid(id)){
			query = Lan.findById(id);
		}else{
			return "not-found";
		}
		return query;
	};

module.exports = function(app, prefix){
	app.get(prefix,
	function(req, res){
		Lan.find({}).sort("-beginDate").exec()
		.then(function(lans){
			res.send(lans || []);
		}).catch(function(){
			res.status(500).end();
		});
	});

	app.get(prefix + "/:lan", 
	function(req, res){
		var query = getLANQuery(req.params.lan);
		if(query === "not-found"){
			return res.status(404).end();
		}

		query.exec()
		.then(function(lan){
			if(!lan) throw 404;
			lan.games.sort(function(a, b){
				return a.sortIndex - b.sortIndex;
			});
			res.send(lan);
		}).catch(handleError(res));
	});

	app.get(prefix + "/:lan/games", 
	function(req, res){
		var year,
			gameSelection = {},
			query = getLANQuery(req.params.lan);
		if(query === "not-found"){
			return res.status(404).end();
		}

		query.exec()
		.then(function(lan){
			if(!lan) throw 404;
			year = lan.beginDate.getFullYear();
			for(var i = 0; i < lan.games.length; i += 1){
				gameSelection[lan.games[i].game] = lan.games[i].sortIndex;
			}
			return Game.find({_id: {$in: Object.keys(gameSelection)}})
				.populate("stores.store")
				.exec();
		}).then(function(games){
			if(!games) throw 404;
			games.sort(function(a, b){
				return gameSelection[a._id] - gameSelection[b._id];
			});
			res.send({
				year: year,
				games: games
			});
		}).catch(handleError(res));
	});

	app.get(prefix + "/:lan/tournaments",
	function(req, res){
		var year,
			gameSelection = {},
			query = getLANQuery(req.params.lan);
		if(query === "not-found"){
			return res.status(404).end();
		}

		query.exec()
		.then(function(lan){
			if(!lan) throw 404;
			var tournaments = [];
			for(var i = 0; i < lan.games.length; i += 1){
				if(lan.games[i].tournament === true){
					tournaments.push(lan.games[i]);
				}
			}
			res.send(tournaments);
		}).catch(handleError(res));
	});

	app.get(prefix + "/:lan/rsvps", 
	function(req, res){
		var query = getLANQuery(req.params.lan),
			thisLan;
		if(query === "not-found"){
			return res.status(404).end();
		}

		query.exec()
		.then(function(lan){
			if(!lan) throw 404;
			thisLan = lan;
			return Rsvp.find({lan: lan._id})
				.populate("user tournaments.game", "email firstName lastName primaryHandle name")
				.exec();
		}).then(function(rsvps){
			for(var i = 0; i < rsvps.length; i += 1){
				for(var j = 0; j < rsvps[i].tournaments.length; j += 1){
					for(var k = 0; k < thisLan.games.length; k += 1){
						if(thisLan.games[k].game.toString() === rsvps[i].tournaments[j].game._id.toString()){
							rsvps[i].tournaments[j].game.tournamentName = thisLan.games[k].tournamentName;
						}
					}
				}
			}
			res.send(rsvps);
		}).catch(handleError(res));
	});

	app.post(prefix, 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		var lan = new Lan(req.body);
		lan.save()
		.then(function(){
			res.status(201)
			.location(prefix + "/" + lan._id)
			.send({_id: lan._id});
		}).catch(function(err){
			res.status(400).end();
		});
	});

	app.put(prefix + "/:lan", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.lan)){
			return res.status(404).end();
		}
		Lan.findByIdAndUpdate(req.params.lan, req.body)
		.then(function(lan){
			if(!lan) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.get(prefix + "/:lan/placements/:game", 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.status(404).end();
		}
		var query = getLANQuery(req.params.lan);
		if(query === "not-found"){
			return res.status(404).end();
		}

		query.exec()
		.then(function(lan){
			if(!lan) throw 404;
			var retVal = null;
			for(var i = 0; i < lan.games.length; i += 1){
				if(lan.games[i].game.toString() === req.params.game){
					retVal = lan.games[i].placements;
				}
			}
			if(retVal !== null){
				if(req.query.populate !== "true"){
					res.send(retVal);
				}else{
					User.find({_id: {$in: retVal}})
					.then(function(users){
						var userInfo = [];
						for(var i = 0; i < users.length; i += 1){
							userInfo.push({
								_id: users[i]._id,
								firstName: users[i].firstName,
								lastName: users[i].lastName,
								primaryHandle: users[i].primaryHandle
							});
						}
						res.send(userInfo);
					}).catch(handleError(res));
				}
			}else{
				throw 404;
			}
		}).catch(handleError(res));
	});

	app.post(prefix + "/:lan/placements/:game", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.status(404).end();
		}
		var query = getLANQuery(req.params.lan),
			users = [],
			thisLan;
		if(query === "not-found"){
			return res.status(404).end();
		}

		query.exec()
		.then(function(lan){
			if(!lan) throw 404;
			thisLan = lan;
			return Rsvp.find({lan: lan._id}).exec();
		}).then(function(rsvps){
			for(var i = 0; i < rsvps.length; i += 1){
				for(var j = 0; j < rsvps[i].tournaments.length; j += 1){
					if(rsvps[i].tournaments[j].game.toString() === req.params.game){
						users.push(rsvps[i].user);
						break;
					}
				}
			}
			users = shuffle(users);
			for(var i = 0; i < thisLan.games.length; i += 1){
				if(thisLan.games[i].game.toString() === req.params.game){
					thisLan.games[i].placements = users;
					break;
				}
			}
			return thisLan.save();
		}).then(function(){
			res.send(users);
		}).catch(handleError(res));
	});

	app.put(prefix + "/:lan/placements/:game", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.status(404).end();
		}
		var query = getLANQuery(req.params.lan);
		if(query === "not-found"){
			return res.status(404).end();
		}

		query.exec()
		.then(function(lan){
			if(!lan) throw 404;
			for(var i = 0; i < lan.games.length; i += 1){
				if(lan.games[i].game.toString() === req.params.game){
					lan.games[i].placements = req.body;
					break;
				}
			}
			return lan.save();
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.get(prefix + "/:lan/scores/:game", 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.status(404).end();
		}
		var query = getLANQuery(req.params.lan);
		if(query === "not-found"){
			return res.status(404).end();
		}

		query.exec()
		.then(function(lan){
			if(!lan) throw 404;
			var placements = null;
			for(var i = 0; i < lan.games.length; i+=1){
				if(lan.games[i].game.toString() === req.params.game){
					placements = lan.games[i].placements;
				}
			}

			return Rsvp.find({lan: lan._id, user: {$in: placements}, tournaments: {$ne: []}}).exec();
		}).then(function(rsvps){
			var scores = [];
			for(var i = 0; i < rsvps.length; i += 1){
				for(var j = 0; j < rsvps[i].tournaments.length; j += 1){
					if(rsvps[i].tournaments[j].game.toString() === req.params.game){
						scores.push({
							user: rsvps[i].user,
							scores: rsvps[i].tournaments[j].scores
						});
					}
				}
			}
			res.send(scores);
		}).catch(handleError(res));
	});

	app.put(prefix + "/:lan/scores/:game", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.status(404).end();
		}
		var query = getLANQuery(req.params.lan);
		if(query === "not-found"){
			return res.status(404).end();
		}

		query.exec()
		.then(function(lan){
			if(!lan) throw 404;
			return Rsvp.find({$and: [{lan: lan._id}, {tournaments: {$ne: []}}]}).exec();
		}).then(function(rsvps){
			var promises = [];
			for(var i = 0; i < rsvps.length; i += 1){
				for(var j = 0; j < req.body.length; j += 1){
					if(rsvps[i].user.toString() === req.body[j].user){
						for(var k = 0; k < rsvps[i].tournaments.length; k += 1){
							if(rsvps[i].tournaments[k].game.toString() === req.params.game){
								rsvps[i].tournaments[k].scores = req.body[j].scores;
								promises.push(rsvps[i].save());
								break;
							}
						}
						req.body.splice(j, 1);
						break;
					}
				}
			}
			Promise.all(promises)
			.then(function(){
				res.status(200).end();
			}).catch(function(err){
				log.error(err);
				res.status(500).end();
			});
		}).catch(handleError(res));
	});

	app.delete(prefix + "/:lan", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.lan)){
			return res.status(404).end();
		}
		Lan.findByIdAndRemove(req.params.lan)
		.then(function(lan){
			if(!lan) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});
};
