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
	blendedAuthenticate = require("../utils.js").blendedAuthenticate;

module.exports = function(app, prefix){
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

	app.post(prefix, blendedAuthentication, function(req, res){
		if(!authorize(req.user, {hasRoles: ["author"]})){
			return res.status(403).end();
		}
	});
}

