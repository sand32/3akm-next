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
	Store = require("../model/store.js"),
	authorize = require("../authorization.js").authorize,
	blendedAuthenticate = require("../utils/common.js").blendedAuthenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB;

module.exports = function(app, prefix){
	app.get(prefix, function(req, res){
		Store.find({}, function(err, docs){
			if(err){
				res.status(500).end();
			}else if(!docs){
				res.status(404).end();
			}else{
				res.status(200).send(docs);
			}
		});
	});

	app.get(prefix + "/:store", 
	function(req, res){
		Store.findById(req.params.store, function(err, doc){
			if(doc){
				res.status(200).send(doc);
			}else{
				res.status(404).end();
			}
		});
	});

	app.post(prefix, 
		blendedAuthenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		var store = new Store(req.body);
		store.save(function(err){
			if(err){
				res.status(400).end();
			}else{
				res.status(201)
				.location(prefix + "/" + store._id)
				.end();
			}
		});
	});

	app.put(prefix + "/:store", 
		blendedAuthenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		Store.findByIdAndUpdate(req.params.store, req.body, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});

	app.delete(prefix + "/:store", 
		blendedAuthenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		Store.findByIdAndRemove(req.params.store, function(err, doc){
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
