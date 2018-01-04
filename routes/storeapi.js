/*
-----------------------------------------------------------------------------
Copyright (c) 2014-2018 Seth Anderson

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

var Store = require("../model/store.js"),
	authorize = require("../utils/authorization.js").authorize,
	authenticate = require("../utils/authentication.js").authenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	checkObjectIDParam = require("../utils/common.js").checkObjectIDParam,
	handleError = require("../utils/common.js").handleError;

module.exports = function(app, prefix){
	app.get(prefix, function(req, res){
		Store.find({})
		.then(function(stores){
			res.send(stores || []);
		}).catch(handleError(res));
	});

	app.get(prefix + "/:store",
		checkObjectIDParam("store"),
	function(req, res){
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
		checkObjectIDParam("store"),
	function(req, res){
		Store.findByIdAndUpdate(req.params.store, req.body)
		.then(function(store){
			if(!store) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.delete(prefix + "/:store",
		authenticate,
		authorize({hasRoles: ["admin"]}),
		checkObjectIDParam("store"),
	function(req, res){
		Store.findByIdAndRemove(req.params.store)
		.then(function(store){
			if(!store) throw 404;
			res.status(204).end();
		}).catch(handleError(res));
	});
};
