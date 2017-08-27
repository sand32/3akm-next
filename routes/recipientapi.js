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

var Recipient = require("../model/recipient.js"),
	User = require("../model/user.js"),
	authenticate = require("../utils/authentication.js").authenticate,
	authorize = require("../utils/authorization.js").authorize,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	checkObjectIDParam = require("../utils/common.js").checkObjectIDParam,
	handleError = require("../utils/common.js").handleError;

module.exports = function(app, prefix){
	app.get(prefix, function(req, res){
		Recipient.find({})
		.then(function(recipients){
			res.send(recipients);
		}).catch(function(err){
			res.status(500).end();
		});
	});

	app.get(prefix + "/:recipient",
		checkObjectIDParam("recipient"),
	function(req, res){
		Recipient.findById(req.params.recipient)
		.then(function(recipient){
			if(!recipient) throw 404;
			res.send(recipient);
		}).catch(handleError(res));
	});

	app.post(prefix,
		authenticate,
		authorize({hasRoles: ["admin"]}),
		sanitizeBodyForDB,
	function(req, res){
		var thisRecipient;
		User.findOne({email: req.body.email})
		.then(function(user){
			if(user) throw 409;
			thisRecipient = new Recipient(req.body);
			thisRecipient.save()
			.then(function(){
				res.status(201)
				.location(prefix + "/" + thisRecipient._id)
				.send({_id: thisRecipient._id});
			}).catch(function(err){
				res.status(400).end();
			});
		}).catch(handleError(res));
	});

	app.put(prefix + "/:recipient",
		authenticate,
		authorize({hasRoles: ["admin"]}),
		sanitizeBodyForDB,
		checkObjectIDParam("recipient"),
	function(req, res){
		Recipient.findByIdAndUpdate(req.params.recipient, req.body)
		.then(function(recipient){
			if(!recipient) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.delete(prefix + "/:recipient",
		authenticate,
		authorize({hasRoles: ["admin"]}),
		checkObjectIDParam("recipient"),
	function(req, res){
		Recipient.findByIdAndRemove(req.params.recipient)
		.then(function(recipient){
			if(!recipient) throw 404;
			res.status(204).end();
		}).catch(handleError(res));
	});
};
