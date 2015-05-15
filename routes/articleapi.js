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
	Article = require("../model/article.js"),
	isAuthorized = require("../authorization.js").isAuthorized,
	authorize = require("../authorization.js").authorize,
	blendedAuthenticate = require("../utils/common.js").blendedAuthenticate,
	removeDuplicates = require("../utils/common.js").removeDuplicates;

module.exports = function(app, prefix){
	app.post(prefix, blendedAuthenticate, authorize({hasRoles: ["author"]}), function(req, res){
		var article = new Article();
		article.title = req.body.title;
		article.author = req.user._id;
		article.published = req.body.published;
		article.tags = removeDuplicates(req.body.tags);
		article.content = req.body.content;
		article.save(function(err){
			if(err){
				res.status(400).end();
			}else{
				res.status(201)
				.location(prefix + "/" + article._id)
				.end();
			}
		});
	});

	app.get(prefix + "/:article", function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.status(404).end();
		}

		Article.findById(req.params.article)
		.populate("author modifiedBy", "email firstName lastName")
		.exec(function(err, doc){
			if(doc){
				if(doc.published || isAuthorized(req.user, {hasRoles: ["author"]})){
					res.status(200).send(doc);
				}else{
					res.status(403).end();
				}
			}else{
				res.status(404).end();
			}
		});
	});

	app.put(prefix + "/:article", blendedAuthenticate, authorize({hasRoles: ["author"]}), function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.status(404).end();
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

	app.delete(prefix + "/:article", blendedAuthenticate, authorize({hasRoles: ["author"]}), function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.article)){
			return res.status(404).end();
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
