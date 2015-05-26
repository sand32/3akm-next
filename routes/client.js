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

var passport = require("passport"),
	mongoose = require("mongoose"),
	isAuthorized = require("../authorization.js").isAuthorized,
	Article = require("../model/article.js"),
	Game = require("../model/game.js"),
	Lan = require("../model/lan.js"),
	Rsvp = require("../model/rsvp.js"),
	User = require("../model/user.js"),
	Store = require("../model/store.js"),
	utils = require("../utils/common.js"),
	ts3 = require("../utils/ts3-serverquery.js"),
	cod4GameInfo = utils.loadConfig(__dirname + "/../config/cod4-gameinfo.json"),
	config = utils.loadConfig(__dirname + "/../config/config.json");

module.exports = function(app, prefix){
	app.get(prefix + "/registrationform", function(req, res){
		res.render("partial/registrationform.jade", {
			recaptchaSiteKey: config.recaptchaSiteKey
		});
	});

	app.get(prefix + "/*", function(req, res){
		if(config.debugMode){
			res.render("partial/" + req.params[0] + ".jade");
		}else{
			res.render("partial/" + req.params[0] + ".jade", {}, function(err, html){
				if(err){
					res.redirect("/partial/404");
				}else{
					res.send(html);
				}
			});
		}
	});

	app.get(prefix + "/profile", function(req, res){
		if(!req.isAuthenticated()){
			return res.redirect("/");
		}
		res.render("usereditor", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user,
			editUser: req.user,
			getFormattedTime: utils.getFormattedTime
		});
	});

	app.get(prefix + "/rsvp", function(req, res){
		Lan.findOne({active: true, acceptingRsvps: true, beginDate: {$gt: Date.now()}}, null, {sort: {beginDate: "-1"}}, function(err, doc){
			if(!err){
				if(req.user){
					Rsvp.findOne({user: req.user._id, lan: doc._id}, function(err, rsvp){
						res.render("rsvpsubmit", {
							isAuthenticated: req.isAuthenticated(),
							user: req.user,
							year: doc ? doc.beginDate.getFullYear() : 0,
							lan: doc,
							existingRsvp: rsvp
						});
					});
				}else{
					res.render("rsvpsubmit", {
						isAuthenticated: req.isAuthenticated(),
						user: null,
						year: doc ? doc.beginDate.getFullYear() : 0,
						lan: doc,
						existingRsvp: null
					});
				}
			}else{
				res.redirect("/");
			}
		});
	});

	app.get(prefix + "/games", function(req, res){
		Store.find()
		.exec(function(err, docs){
			if(!err){
				Lan.findOne({active: true}, null, {sort: {beginDate: "-1"}})
				.populate("games.game")
				.exec(function(err2, doc){
					if(!err2){
						res.render("games", {
							isAuthenticated: req.isAuthenticated(),
							user: req.user,
							year: doc ? doc.beginDate.getFullYear() : 0,
							games: doc ? doc.games : null,
							stores: docs
						});
					}else{
						res.redirect("/");
					}
				});
			}else{
				res.redirect("/");
			}
		});
	});

	app.get(prefix + "/prep", function(req, res){
		res.render("prep", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user
		});
	});

	app.get(prefix + "/appearances", function(req, res){
		Lan.findOne({active: true, acceptingRsvps: true}, null, {sort: {beginDate: "-1"}})
		.exec(function(err, lan){
			if(!err && lan){
				Rsvp.find({lan: lan._id})
				.where("status").ne("No")
				.populate("user")
				.exec(function(err2, rsvps){
					if(!err2){
						res.render("appearances", {
							isAuthenticated: req.isAuthenticated(),
							user: req.user,
							lan: lan,
							rsvps: rsvps
						});
					}else{
						res.render("appearances", {
							isAuthenticated: req.isAuthenticated(),
							user: req.user,
							lan: lan,
							rsvps: null
						});
					}
				});
			}else{
				res.render("appearances", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					lan: null,
					rsvps: null
				});
			}
		});
	});

	app.get(prefix + "/article/:article", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.redirect("/");
		}
		Article.findById(req.params.article)
		.populate("author modifiedBy", "email firstName lastName")
		.exec(function(err, doc){
			if(!err && doc && (doc.published || isAuthorized(req.user, {hasRoles:["author"]}))){
				res.render("article", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					article: doc,
					getFormattedTime: utils.getFormattedTime
				});
			}else{
				res.redirect("/");
			}
		});
	});

	app.get(prefix + "/authoring/article", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user, {hasRoles:["author"]})){
			return res.redirect("/");
		}

		Article.find({}, "title author created published")
		.populate("author", "email firstName lastName")
		.sort(req.query.sort)
		.exec(function(err, docs){
			res.render("articlemanager", {
				isAuthenticated: req.isAuthenticated(),
				user: req.user,
				articles: docs,
				sort: req.query.sort,
				getFormattedTime: utils.getFormattedTime,
				getSortClassForHeader: utils.getSortClassForHeader,
				getSortLinkForHeader: utils.getSortLinkForHeader
			});
		});
	});

	app.get(prefix + "/authoring/article/new", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user, {hasRoles:["author"]})){
			return res.redirect("/");
		}
		res.render("articleeditor", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user
		});
	});

	app.get(prefix + "/authoring/article/:article", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.redirect("/");
		}else if(!req.isAuthenticated()
			  || !isAuthorized(req.user, {hasRoles: ["author"]})){
			return res.redirect("/");
		}
		Article.findById(req.params.article)
		.populate("author modifiedBy", "email firstName lastName")
		.exec(function(err, doc){
			if(!err && doc){
				res.render("articleeditor", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					article: doc,
					getFormattedTime: utils.getFormattedTime
				});
			}else{
				res.redirect("/authoring/article");
			}
		});
	});

	app.get(prefix + "/admin/user", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user)){
			return res.redirect("/");
		}

		User.find({}, "firstName lastName email verified accessed")
		.sort(req.query.sort)
		.exec(function(err, docs){
			res.render("usermanager", {
				isAuthenticated: req.isAuthenticated(),
				user: req.user,
				editUsers: docs,
				sort: req.query.sort,
				getFormattedTime: utils.getFormattedTime,
				getSortClassForHeader: utils.getSortClassForHeader,
				getSortLinkForHeader: utils.getSortLinkForHeader
			});
		});
	});

	app.get(prefix + "/admin/user/new", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user)){
			return res.redirect("/");
		}
		res.render("usereditor", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user
		});
	});

	app.get(prefix + "/admin/user/:user", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.redirect("/");
		}else if(!req.isAuthenticated()
			  || !isAuthorized(req.user)){
			return res.redirect("/");
		}
		User.findById(req.params.user)
		.exec(function(err, doc){
			if(!err && doc){
				res.render("usereditor", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					editUser: doc,
					getFormattedTime: utils.getFormattedTime
				});
			}else{
				res.redirect("/admin/user");
			}
		});
	});

	app.get(prefix + "/admin/lan", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user)){
			return res.redirect("/");
		}

		Lan.find({}, "beginDate endDate active acceptingRsvps")
		.sort(req.query.sort)
		.exec(function(err, docs){
			res.render("lanmanager", {
				isAuthenticated: req.isAuthenticated(),
				user: req.user,
				lans: docs,
				sort: req.query.sort,
				getFormattedTime: utils.getFormattedTime,
				getSortClassForHeader: utils.getSortClassForHeader,
				getSortLinkForHeader: utils.getSortLinkForHeader
			});
		});
	});

	app.get(prefix + "/admin/lan/new", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user)){
			return res.redirect("/");
		}
		Game.find({}, "name")
		.sort("name")
		.exec(function(err, docs){
			if(!err){
				res.render("laneditor", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					games: docs
				});
			}else{
				res.status(500).end();
			}
		});
	});

	app.get(prefix + "/admin/lan/:lan", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.lan)){
			return res.redirect("/");
		}else if(!req.isAuthenticated()
			  || !isAuthorized(req.user)){
			return res.redirect("/");
		}
		Lan.findById(req.params.lan)
		.populate("games.game")
		.exec(function(err, doc){
			Game.find({}, "name")
			.sort("name")
			.exec(function(err2, docs){
				if(!err && !err2 && doc){
					res.render("laneditor", {
						isAuthenticated: req.isAuthenticated(),
						user: req.user,
						games: docs,
						lan: doc,
						getFormattedTime: utils.getFormattedTime
					});
				}else{
					res.redirect("/admin/lan");
				}
			});
		});
	});

	app.get(prefix + "/admin/game", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user)){
			return res.redirect("/");
		}

		Game.find({}, "name version supplementalFiles")
		.sort(req.query.sort)
		.exec(function(err, docs){
			res.render("gamemanager", {
				isAuthenticated: req.isAuthenticated(),
				user: req.user,
				games: docs,
				sort: req.query.sort,
				getSortClassForHeader: utils.getSortClassForHeader,
				getSortLinkForHeader: utils.getSortLinkForHeader
			});
		});
	});

	app.get(prefix + "/admin/game/new", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user)){
			return res.redirect("/");
		}
		Store.find()
		.exec(function(err, docs){
			res.render("gameeditor", {
				isAuthenticated: req.isAuthenticated(),
				user: req.user,
				stores: docs
			});
		});
	});

	app.get(prefix + "/admin/game/:game", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.redirect("/");
		}else if(!req.isAuthenticated()
			  || !isAuthorized(req.user)){
			return res.redirect("/");
		}
		Store.find()
		.exec(function(err, docs){
			Game.findById(req.params.game)
			.populate("stores.store")
			.exec(function(err2, doc){
				if(!err2 && doc){
					res.render("gameeditor", {
						isAuthenticated: req.isAuthenticated(),
						user: req.user,
						game: doc,
						stores: docs
					});
				}else{
					res.redirect("/admin/game");
				}
			});
		});
	});

	app.get(prefix + "/admin/service/cod4", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user)){
			return res.redirect("/");
		}
		res.render("cod4", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user,
			cod4GameInfo: cod4GameInfo
		});
	});

	app.get(prefix + "/admin/service/ts3", function(req, res){
		if(!req.isAuthenticated()
		|| !isAuthorized(req.user)){
			return res.redirect("/");
		}
		ts3.listServers(function(err, data){
			res.render("ts3", {
				isAuthenticated: req.isAuthenticated(),
				user: req.user,
				serverlist: data ? (Array.isArray(data) ? data : [data]) : null,
				secondsToHumanReadableDuration: utils.secondsToHumanReadableDuration
			});
		});
	});

	app.get(prefix + "/admin/service/ts3/:serverId", function(req, res){
		if(isNaN(req.params.serverId)){
			return res.redirect("/");
		}else if(!req.isAuthenticated()
			  || !isAuthorized(req.user)){
			return res.redirect("/");
		}
		ts3.serverInfo(req.params.serverId, function(err, data){
			if(err){
				res.status(404).end();
			}else{
				res.render("ts3serveredit", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					server: data ? data : null,
					secondsToHumanReadableDuration: utils.secondsToHumanReadableDuration
				});
			}
		});
	});
}
