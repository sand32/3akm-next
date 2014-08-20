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
	User = require("../model/user.js"),
	getFormattedTime = require("../utils.js").getFormattedTime;

module.exports = function(app, prefix){
	app.get(prefix + "/", function(req, res){
		Article.findOne({})
		.populate("author")
		.populate("modifiedBy")
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

	app.get(prefix + "/article/:article", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.redirect("/");
		}
		Article.findById(req.params.article)
		.populate("author")
		.populate("modifiedBy")
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
		Article.find({}, "title author created modifiedBy modified published tags")
		.populate("author")
		.exec(function(err, docs){
			res.render("articlemanager", {
				isAuthenticated: req.isAuthenticated(),
				user: req.user,
				articles: docs,
				getFormattedTime: getFormattedTime
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
		.populate("author")
		.populate("modifiedBy")
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
		|| !authorize(req.user, {})){
			return res.redirect("/");
		}
		User.find({}, "email firstName lastName created accessed verified", function(err, docs){
			res.render("usermanager", {
				isAuthenticated: req.isAuthenticated(),
				user: req.user,
				editUsers: docs,
				getFormattedTime: getFormattedTime
			});
		});
	});

	app.get(prefix + "/admin/user/new", function(req, res){
		if(!req.isAuthenticated()
		|| !authorize(req.user, {})){
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
			  || !authorize(req.user, {})){
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
}
