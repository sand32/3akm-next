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
	Recipient = require("../model/recipient.js"),
	User = require("../model/user.js"),
	authenticate = require("../utils/common.js").authenticate,
	authorize = require("../authorization.js").authorize,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB;

module.exports = function(app, prefix){
	app.get(prefix, function(req, res){
		Recipient.find({}, function(err, docs){
			if(err){
				res.status(500).end();
			}else if(!docs){
				res.status(404).end();
			}else{
				res.status(200).send(docs);
			}
		});
	});

	app.get(prefix + "/:recipient", 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.recipient)){
			return res.status(404).end();
		}
		Recipient.findById(req.params.recipient, function(err, doc){
			if(err){
				res.status(500).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).send(doc);
			}
		});
	});

	app.post(prefix, 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		User.findOne({email: req.body.email}, function(err, doc){
			if(err){
				res.status(500).end();
			}else if(doc){
				res.status(409).end();
			}else{
				var recipient = new Recipient(req.body);
				recipient.save(function(err){
					if(err){
						res.status(400).end();
					}else{
						res.status(201)
						.location(prefix + "/" + recipient._id)
						.send({_id: recipient._id});
					}
				});
			}
		});
	});

	app.put(prefix + "/:recipient", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.recipient)){
			return res.status(404).end();
		}
		Recipient.findByIdAndUpdate(req.params.recipient, req.body, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});

	app.delete(prefix + "/:recipient", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.recipient)){
			return res.status(404).end();
		}
		Recipient.findByIdAndRemove(req.params.recipient, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});
};
