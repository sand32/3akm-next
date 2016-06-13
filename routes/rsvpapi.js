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
	Lan = require("../model/lan.js"),
	Rsvp = require("../model/rsvp.js"),
	authorize = require("../authorization.js").authorize,
	authorizeSessionUser = require("../authorization.js").authorizeSessionUser,
	authenticate = require("../utils/common.js").authenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB;

module.exports = function(app, prefix, prefix2){
	app.get(prefix,
	function(req, res){
		Rsvp.find({})
		.populate("user lan", "email firstName lastName beginDate")
		.sort("-lan.beginDate")
		.exec(function(err, docs){
			if(err){
				res.status(500).end();
			}else{
				res.send(docs || []);
			}
		});
	});

	app.get(prefix + "/:rsvp",
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.rsvp)){
			return res.status(404).end();
		}
		Rsvp.findById(req.params.rsvp)
		.populate("user lan", "email firstName lastName beginDate")
		.exec(function(err, doc){
			if(err){
				res.status(500).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.send(doc);
			}
		});
	});

	app.post(prefix,
		authenticate, 
		authorize({hasRole: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		var rsvp = new Rsvp(req.body);
		rsvp.save(function(err){
			if(err){
				res.status(400).end();
			}else{
				res.status(201)
				.location(prefix2 + "/" + rsvp._id)
				.send({_id: rsvp._id});
			}
		});
	});

	app.put(prefix + "/:rsvp", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.rsvp)){
			return res.status(404).end();
		}
		Rsvp.findByIdAndUpdate(req.params.rsvp, req.body, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});

	app.delete(prefix + "/:rsvp", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.rsvp)){
			return res.status(404).end();
		}
		Rsvp.findByIdAndRemove(req.params.rsvp, function(err, doc){
			if(err){
				res.status(400).end();
			}else if(!doc){
				res.status(404).end();
			}else{
				res.status(200).end();
			}
		});
	});

	app.get(prefix + "/year/:year",
	function(req, res){
		Lan.findOne({
			active: true,
			acceptingRsvps: true
		})
		.$where("this.beginDate.getFullYear() === " + req.params.year)
		.exec(function(err, lan){
			if(err){
				res.status(500).end();
			}else if(!lan){
				res.status(404).end();
			}else{
				Rsvp.find({lan: lan._id})
				.populate("user", "email firstName lastName primaryHandle")
				.exec(function(err, docs){
					if(err){
						res.status(500).end();
					}else{
						res.send(docs || []);
					}
				});
			}
		});
	});

	app.get(prefix2 + "/:year", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		Lan.findOne({
			active: true,
			acceptingRsvps: true
		})
		.$where("this.beginDate.getFullYear() === " + req.params.year)
		.exec(function(err, lan){
			if(err){
				res.status(500).end();
			}else if(!lan){
				res.status(404).end();
			}else{
				Rsvp.findOne({user: req.params.user}, function(err, doc){
					if(err){
						res.status(500).end();
					}else if(!doc){
						res.status(404).end();
					}else{
						res.send(doc);
					}
				});
			}
		});
	});

	app.put(prefix2 + "/:year", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		Lan.findOne({
			active: true,
			acceptingRsvps: true
		})
		.$where("this.beginDate.getFullYear() === " + req.params.year)
		.exec(function(err, lanDoc){
			if(err || !lanDoc){
				res.status(404).end();
			}else{
				Rsvp.findOne({user: req.params.user, lan: lanDoc._id}, function(err, doc){
					if(err || !doc){
						var rsvp = new Rsvp();
						rsvp.user = req.params.user;
						rsvp.lan = lanDoc._id;
						rsvp.status = req.body.status;
						rsvp.playing = req.body.playing;
						rsvp.guests = req.body.guests;
						rsvp.cleaning = req.body.cleaning;
						rsvp.tournaments = req.body.tournaments;
						rsvp.bringingFood = req.body.bringingFood;
						rsvp.save(function(err){
							if(err){
								res.status(500).end();
							}else{
								res.status(201)
								.location(prefix + "/" + req.params.year)
								.end();
							}
						});
					}else{
						doc.status = req.body.status;
						doc.playing = req.body.playing;
						doc.guests = req.body.guests;
						doc.cleaning = req.body.cleaning;
						doc.tournaments = req.body.tournaments;
						doc.bringingFood = req.body.bringingFood;
						doc.save(function(err){
							if(err){
								res.status(500).end();
							}else{
								res.status(200).end();
							}
						});
					}
				});
			}
		});
	});

	app.put(prefix2 + "/:year/attended", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}

		Lan.findOne({
			active: true,
			acceptingRsvps: true
		})
		.$where("this.beginDate.getFullYear() === " + req.params.year)
		.exec(function(err, lanDoc){
			if(err || !lanDoc){
				res.status(404).end();
			}else{
				Rsvp.findOne({user: req.params.user, lan: lanDoc._id}, function(err, doc){
					if(err || !doc){
						res.status(404).end();
					}else{
						doc.attended = true;
						doc.save(function(err){
							if(err){
								res.status(500).end();
							}else{
								res.status(200).end();
							}
						});
					}
				});
			}
		});
	});
}