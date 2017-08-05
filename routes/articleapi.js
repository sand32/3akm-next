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

var Article = require("../model/article.js"),
	isAuthorized = require("../authorization.js").isAuthorized,
	authorize = require("../authorization.js").authorize,
	authenticate = require("../utils/common.js").authenticate,
	removeDuplicates = require("../utils/common.js").removeDuplicates,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	checkObjectIDParam = require("../utils/common.js").checkObjectIDParam,
	handleError = require("../utils/common.js").handleError;

module.exports = function(app, prefix){
	app.get(prefix, function(req, res){
		isAuthorized(req.user, {hasRoles: ["author"]})
		.then(function(authorized){
			if(authorized){
				Article.find({})
				.sort("-created")
				.populate("author modifiedBy", "email firstName lastName")
				.exec()
				.then(function(articles){
					res.send(articles || []);
				}).catch(handleError(res));
			}else{
				Article.find({published: true})
				.sort("-created")
				.populate("author modifiedBy", "email firstName lastName")
				.exec()
				.then(function(articles){
					res.send(articles || []);
				}).catch(handleError(res));
			}
		});
	});

	app.get(prefix + "/newest", function(req, res){
		Article.findOne({published: true})
		.sort("-created")
		.populate("author modifiedBy", "email firstName lastName")
		.exec()
		.then(function(article){
			if(!article) throw 404;
			res.send(article);
		}).catch(handleError(res));
	});

	app.get(prefix + "/:article",
		checkObjectIDParam("article"),
	function(req, res){
		var thisArticle;
		Article.findById(req.params.article)
		.populate("author modifiedBy", "email firstName lastName")
		.then(function(article){
			if(!article) throw 404;
			thisArticle = article;
			return isAuthorized(req.user, {hasRoles: ["author"]});
		}).then(function(authorized){
			if(thisArticle.published || authorized){
				res.send(thisArticle);
			}else{
				throw 403;
			}
		}).catch(handleError(res));
	});

	app.post(prefix,
		authenticate,
		authorize({hasRoles: ["author"]}),
		sanitizeBodyForDB,
	function(req, res){
		var article = new Article();
		article.title = req.body.title;
		article.author = req.user._id;
		article.published = req.body.published;
		article.tags = removeDuplicates(req.body.tags);
		article.content = req.body.content;
		article.save()
		.then(function(){
			res.status(201)
			.location(prefix + "/" + article._id)
			.send({_id: article._id});
		}).catch(function(){
			throw 400;
		}).catch(handleError(res));
	});

	app.put(prefix + "/:article",
		authenticate,
		authorize({hasRoles: ["author"]}),
		sanitizeBodyForDB,
		checkObjectIDParam("article"),
	function(req, res){
		// Remove duplicate tags
		req.body.tags = removeDuplicates(req.body.tags);

		// Remove fields that should not be updated
		delete req.body._v;
		delete req.body._id;
		delete req.body.author;
		delete req.body.created;

		// Record this modification
		req.body.modifiedBy = req.user._id;
		req.body.modified = Date.now();

		// Apply the update
		Article.findByIdAndUpdate(req.params.article, req.body)
		.then(function(article){
			if(!article) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.delete(prefix + "/:article",
		authenticate,
		authorize({hasRoles: ["author"]}),
		checkObjectIDParam("article"),
	function(req, res){
		Article.findByIdAndRemove(req.params.article)
		.then(function(article){
			if(!article) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});
};
