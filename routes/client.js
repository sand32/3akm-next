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

var passport = require("passport"),
	mongoose = require("mongoose"),
	authorize = require("../authorization.js"),
	Article = require("../model/article.js"),
	Game = require("../model/game.js"),
	Lan = require("../model/lan.js"),
	User = require("../model/user.js"),
	getFormattedTime = require("../utils.js").getFormattedTime;
	getSortClassForHeader = require("../utils.js").getSortClassForHeader;
	getSortLinkForHeader = require("../utils.js").getSortLinkForHeader;

module.exports = function(app, prefix){
	app.get(prefix + "/", function(req, res){
		Article.findOne({})
		.populate("author modifiedBy", "email firstName lastName")
		.exec(function(err, doc){
			if(!err && doc && doc.published){
				res.render("article", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					article: doc,
					getFormattedTime: getFormattedTime
				});
			}else{
				res.render("article", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					getFormattedTime: getFormattedTime
				});
			}
		});
	});

	app.get(prefix + "/register", function(req, res){
		if(req.isAuthenticated()){
			return res.redirect("/");
		}
		res.render("usereditor", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user
		});
	});

	app.get(prefix + "/profile", function(req, res){
		if(!req.isAuthenticated()){
			return res.redirect("/");
		}
		res.render("usereditor", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user,
			editUser: req.user,
			containsTokenField: req.user.hasRole("admin"),
			getFormattedTime: getFormattedTime
		});
	});

	app.get(prefix + "/games", function(req, res){
		Lan.findOne({active: true}, "games", {sort: {beginDate: "-1"}})
		.populate("games.game")
		.exec(function(err, doc){
			res.render("games", {
				isAuthenticated: req.isAuthenticated(),
				user: req.user,
				year: doc ? doc.beginDate.getFullYear() : 0,
				games: doc ? doc.games : doc
			});
		});
	});

	app.get(prefix + "/article/:article", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.redirect("/");
		}
		Article.findById(req.params.article)
		.populate("author modifiedBy", "email firstName lastName")
		.exec(function(err, doc){
			if(!err && doc && (doc.published || authorize(req.user, {hasRoles:["author"]}))){
				res.render("article", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					article: doc,
					getFormattedTime: getFormattedTime
				});
			}else{
				res.redirect("/");
			}
		});
	});

	app.get(prefix + "/authoring/article", function(req, res){
		if(!req.isAuthenticated()
		|| !authorize(req.user, {hasRoles:["author"]})){
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
				getFormattedTime: getFormattedTime,
				getSortClassForHeader: getSortClassForHeader,
				getSortLinkForHeader: getSortLinkForHeader
			});
		});
	});

	app.get(prefix + "/authoring/article/new", function(req, res){
		if(!req.isAuthenticated()
		|| !authorize(req.user, {hasRoles:["author"]})){
			return res.redirect("/");
		}
		res.render("articleeditor", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user,
			containsTokenField: true,
			containsEditor: true
		});
	});

	app.get(prefix + "/authoring/article/:article", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.redirect("/");
		}else if(!req.isAuthenticated()
			  || !authorize(req.user, {hasRoles: ["author"]})){
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
					containsTokenField: true,
					containsEditor: true,
					getFormattedTime: getFormattedTime
				});
			}else{
				res.redirect("/");
			}
		});
	});

	app.get(prefix + "/admin/user", function(req, res){
		if(!req.isAuthenticated()
		|| !authorize(req.user)){
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
				getFormattedTime: getFormattedTime,
				getSortClassForHeader: getSortClassForHeader,
				getSortLinkForHeader: getSortLinkForHeader
			});
		});
	});

	app.get(prefix + "/admin/user/new", function(req, res){
		if(!req.isAuthenticated()
		|| !authorize(req.user)){
			return res.redirect("/");
		}
		res.render("usereditor", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user,
			containsTokenField: true
		});
	});

	app.get(prefix + "/admin/user/:user", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.redirect("/");
		}else if(!req.isAuthenticated()
			  || !authorize(req.user)){
			return res.redirect("/");
		}
		User.findById(req.params.user)
		.exec(function(err, doc){
			if(!err && doc){
				res.render("usereditor", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					editUser: doc,
					containsTokenField: true,
					getFormattedTime: getFormattedTime
				});
			}else{
				res.redirect("/");
			}
		});
	});

	app.get(prefix + "/admin/lan", function(req, res){
		if(!req.isAuthenticated()
		|| !authorize(req.user)){
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
				getSortClassForHeader: getSortClassForHeader,
				getSortLinkForHeader: getSortLinkForHeader
			});
		});
	});

	app.get(prefix + "/admin/lan/new", function(req, res){
		if(!req.isAuthenticated()
		|| !authorize(req.user)){
			return res.redirect("/");
		}
		res.render("laneditor", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user
		});
	});

	app.get(prefix + "/admin/lan/:lan", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.lan)){
			return res.redirect("/");
		}else if(!req.isAuthenticated()
			  || !authorize(req.user)){
			return res.redirect("/");
		}
		User.findById(req.params.lan)
		.exec(function(err, doc){
			if(!err && doc){
				res.render("laneditor", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					lan: doc,
					getFormattedTime: getFormattedTime
				});
			}else{
				res.redirect("/");
			}
		});
	});

	app.get(prefix + "/admin/game", function(req, res){
		if(!req.isAuthenticated()
		|| !authorize(req.user)){
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
				getSortClassForHeader: getSortClassForHeader,
				getSortLinkForHeader: getSortLinkForHeader
			});
		});
	});

	app.get(prefix + "/admin/game/new", function(req, res){
		if(!req.isAuthenticated()
		|| !authorize(req.user)){
			return res.redirect("/");
		}
		res.render("gameeditor", {
			isAuthenticated: req.isAuthenticated(),
			user: req.user,
			containsEditor: true
		});
	});

	app.get(prefix + "/admin/game/:game", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.game)){
			return res.redirect("/");
		}else if(!req.isAuthenticated()
			  || !authorize(req.user)){
			return res.redirect("/");
		}
		Game.findById(req.params.game)
		.exec(function(err, doc){
			if(!err && doc){
				res.render("gameeditor", {
					isAuthenticated: req.isAuthenticated(),
					user: req.user,
					game: doc,
					containsEditor: true
				});
			}else{
				res.redirect("/");
			}
		});
	});
}
