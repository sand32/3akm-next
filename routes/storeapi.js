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
	Store = require("../model/store.js"),
	authorize = require("../authorization.js").authorize,
	authenticate = require("../utils/common.js").authenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	handleError = require("../utils/common.js").handleError;

module.exports = function(app, prefix){
	app.get(prefix, function(req, res){
		Store.find({})
		.then(function(stores){
			res.send(stores || []);
		}).catch(handleError(res));
	});

	app.get(prefix + "/:store", 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.store)){
			return res.status(404).end();
		}
		Store.findById(req.params.store)
		.then(function(store){
			if(!store) throw 404;
			res.send(store);
		}).catch(handleError(res));
	});

	app.post(prefix, 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		var store = new Store(req.body);
		store.save()
		.then(function(){
			res.status(201)
			.location(prefix + "/" + store._id)
			.end();
		}).catch(function(err){
			throw 400;
		}).catch(handleError(res));
	});

	app.put(prefix + "/:store", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.store)){
			return res.status(404).end();
		}
		Store.findByIdAndUpdate(req.params.store, req.body)
		.then(function(store){
			if(!store) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.delete(prefix + "/:store", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.store)){
			return res.status(404).end();
		}
		Store.findByIdAndRemove(req.params.store)
		.then(function(store){
			if(!store) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});
};
