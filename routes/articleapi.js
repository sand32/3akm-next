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
	Article = require("../model/article.js"),
	authorize = require("../authorization.js"),
	blendedAuthenticate = require("../utils.js").blendedAuthenticate,
	removeDuplicates = require("../utils.js").removeDuplicates;

module.exports = function(app, prefix){
	app.post(prefix, blendedAuthenticate, function(req, res){
		if(!authorize(req.user, {hasRoles: ["author"]})){
			return res.status(403).end();
		}

		try{
			var article = new Article();
			article.title = req.body.title;
			article.author = req.user._id;
			article.published = req.body.published;
			article.tags = removeDuplicates(req.body.tags);
			article.content = req.body.content;
			article.save();
			res.status(201).end();
		}catch(e){
			res.status(400).end();
		}
	});

	app.get(prefix + "/:article", function(req, res){
		Article.findById(req.params.article)
		.populate("author")
		.populate("modifiedBy")
		.exec(function(err, doc){
			if(doc){
				doc.populate();
				var article = {
					title: doc.title,
					author: {
						email: doc.author.email,
						name: doc.author.firstName + " " + doc.author.lastName
					},
					published: doc.published,
					modifiedBy: {
						email: (doc.modifiedBy ? doc.modifiedBy.email : null),
						name: (doc.modifiedBy ? doc.modifiedBy.firstName + " " + doc.modifiedBy.lastName : null)
					},
					modified: doc.modified,
					tags: doc.tags,
					content: doc.content
				};
				res.status(200).send(article);
			}else{
				res.status(404).end();
			}
		});
	});

	app.put(prefix + "/:article", blendedAuthenticate, function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.status(404).end();
		}else if(!authorize(req.user, {hasRoles: ["author"]})){
			return res.status(403).end();
		}

		// Remove duplicate tags
		req.body.tags = removeDuplicates(req.body.tags);

		// Remove fields that should not be updated
		delete req.body.author;
		delete req.body.created;

		// Record this modification
		req.body.modifiedBy = req.user._id;
		req.body.modified = Date.now();

		// Apply the update
		Article.findByIdAndUpdate(req.params.article, req.body, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});

	app.delete(prefix + "/:article", blendedAuthenticate, function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.status(404).end();
		}else if(!authorize(req.user, {hasRoles: ["author"]})){
			return res.status(403).end();
		}

		Article.findByIdAndRemove(req.params.article, function(err, doc){
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
