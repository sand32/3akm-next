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

var mongoose = require("mongoose"),
	Game = require("../model/game.js"),
	Lan = require("../model/lan.js"),
	authorize = require("../authorization.js").authorize,
	authenticate = require("../utils/common.js").authenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	checkObjectIDParam = require("../utils/common.js").checkObjectIDParam,
	handleError = require("../utils/common.js").handleError;

module.exports = function(app, prefix){
	app.get(prefix,
	function(req, res){
		Game.find({})
		.sort("name")
		.then(function(games){
			res.send(games || []);
		}).catch(handleError(res));
	});

	app.get(prefix + "/:game",
		checkObjectIDParam("game"),
	function(req, res){
		Game.findById(req.params.game)
		.then(function(game){
			if(!game) throw 404;
			res.send(game);
		}).catch(handleError(res));
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
		game.save()
		.then(function(){
			res.status(201)
			.location(prefix + "/" + game._id)
			.send({_id: game._id});
		}).catch(function(err){
			throw 400;
		}).catch(handleError(res));
	});

	app.put(prefix + "/:game",
		authenticate,
		authorize({hasRoles: ["admin"]}),
		sanitizeBodyForDB,
		checkObjectIDParam("game"),
	function(req, res){
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
		Game.findByIdAndUpdate(req.params.game, req.body)
		.then(function(game){
			if(!game) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.delete(prefix + "/:game",
		authenticate,
		authorize({hasRoles: ["admin"]}),
		checkObjectIDParam("game"),
	function(req, res){
		Lan.find({"games.game": req.params.game})
		.then(function(lans){
			if(lans){
				for(var i = 0; i < lans.length; i += 1){
					for(var j = 0; j < lans[i].games.length; j += 1){
						if(lans[i].games[j].game.toString() == req.params.game){
							lans[i].games.splice(j, 1);
						}
					}
					lans[i].save();
				}
			}
		});
		Game.findByIdAndRemove(req.params.game)
		.then(function(game){
			if(!game) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});
};
