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
	Lan = require("../model/lan.js"),
	Rsvp = require("../model/rsvp.js"),
	authorize = require("../authorization.js").authorize,
	authorizeSessionUser = require("../authorization.js").authorizeSessionUser,
	blendedAuthenticate = require("../utils/common.js").blendedAuthenticate;

module.exports = function(app, prefix, prefix2){
	app.get(prefix2 + "/:year",
		blendedAuthenticate,
		authorize(),
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
				.exec(function(err, rsvps){
					if(err){
						res.status(500).end();
					}else{
						res.send(rsvps);
					}
				});
			}
		});
	});

	app.get(prefix + "/:year", 
		blendedAuthenticate, 
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
				Rsvp.findOne({user: req.params.user}, function(err, rsvp){
					if(err){
						res.status(500).end();
					}else if(!rsvp){
						res.status(404).end();
					}else{
						res.send(rsvp);
					}
				});
			}
		});
	});

	app.put(prefix + "/:year", 
		blendedAuthenticate, 
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
				Rsvp.findOne({user: req.params.user, lan: lanDoc._id}, function(err, rsvpDoc){
					if(err || !rsvpDoc){
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
						rsvpDoc.status = req.body.status;
						rsvpDoc.playing = req.body.playing;
						rsvpDoc.guests = req.body.guests;
						rsvpDoc.cleaning = req.body.cleaning;
						rsvpDoc.tournaments = req.body.tournaments;
						rsvpDoc.bringingFood = req.body.bringingFood;
						rsvpDoc.save(function(err){
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

	app.put(prefix + "/:year/attended", 
		blendedAuthenticate, 
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
				Rsvp.findOne({user: req.params.user, lan: lanDoc._id}, function(err, rsvpDoc){
					if(err || !rsvpDoc){
						res.status(404).end();
					}else{
						rsvpDoc.attended = true;
						rsvpDoc.save(function(err){
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