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
	User = require("../model/user.js"),
	authorize = require("../authorization.js").authorize,
	authorizeSessionUser = require("../authorization.js").authorizeSessionUser,
	authenticate = require("../utils/common.js").authenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	handleError = require("../utils/common.js").handleError,
	config = require("../utils/common.js").config,
	log = require("../utils/log.js"),
	Request = require("request");

module.exports = function(app, prefix, prefix2){
	app.get(prefix,
	function(req, res){
		Rsvp.find({})
		.populate("user lan", "email firstName lastName beginDate")
		.sort("-lan.beginDate")
		.exec()
		.then(function(rsvps){
			res.send(rsvps || []);
		}).catch(handleError(res));
	});

	app.get(prefix + "/:rsvp",
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.rsvp)){
			return res.status(404).end();
		}
		Rsvp.findById(req.params.rsvp)
		.populate("user lan", "email firstName lastName beginDate")
		.exec()
		.then(function(rsvp){
			if(!rsvp) throw 404;
			res.send(rsvp);
		}).catch(handleError(res));
	});

	app.post(prefix,
		authenticate, 
		authorize({hasRole: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		var rsvp = new Rsvp(req.body);
		rsvp.save()
		.then(function(){
			res.status(201)
			.location(prefix2 + "/" + rsvp._id)
			.send({_id: rsvp._id});
		}).catch(function(err){
			throw 400;
		}).catch(handleError(res));
	});

	app.put(prefix + "/:rsvp", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
		sanitizeBodyForDB, 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.rsvp)){
			return res.status(404).end();
		}
		Rsvp.findByIdAndUpdate(req.params.rsvp, req.body)
		.then(function(rsvp){
			if(!rsvp) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.delete(prefix + "/:rsvp", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.rsvp)){
			return res.status(404).end();
		}
		Rsvp.findByIdAndRemove(req.params.rsvp)
		.then(function(rsvp){
			if(!rsvp) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.get(prefix + "/year/:year",
	function(req, res){
		Lan.findOne({
			active: true,
			acceptingRsvps: true
		})
		.$where("this.beginDate.getFullYear() === " + req.params.year).exec()
		.then(function(lan){
			if(!lan) throw 404;
			return Rsvp.find({lan: lan._id})
			.populate("user", "email firstName lastName primaryHandle")
			.exec();
		}).then(function(rsvps){
			res.send(rsvps || []);
		}).catch(handleError(res));
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
		.exec()
		.then(function(lan){
			if(!lan) throw 404;
			return Rsvp.findOne({user: req.params.user});
		}).then(function(rsvp){
			if(!rsvp) throw 404;
			res.send(rsvp);
		}).catch(handleError(res));
	});

	app.put(prefix2 + "/:year", 
		authenticate, 
		authorizeSessionUser(), 
	function(req, res){
		if(!mongoose.Types.ObjectId.isValid(req.params.user)){
			return res.status(404).end();
		}
		var lan, rsvp;

		Lan.findOne({
			active: true,
			acceptingRsvps: true
		})
		.$where("this.beginDate.getFullYear() === " + req.params.year)
		.exec()
		.then(function(doc){
			lan = doc;
			if(!lan) throw 404;
			return Rsvp.findOne({user: req.params.user, lan: lan._id});
		}).then(function(doc){
			rsvp = doc;
			if(!rsvp) throw 404;
			rsvp.status = req.body.status;
			rsvp.playing = req.body.playing;
			rsvp.guests = req.body.guests;
			rsvp.cleaning = req.body.cleaning;
			rsvp.tournaments = req.body.tournaments;
			rsvp.bringingFood = req.body.bringingFood;
			rsvp.save(function(err){
				if(err){
					res.status(400).end();
				}else{
					res.status(200).end();
				}
			});

			// Send a notification to Slack
			if(config.slackRsvpHook.startsWith("http")){
				User.findById(req.params.user)
				.then(function(user){
					if(user){
						Request({
							method: "POST",
							uri: config.slackRsvpHook,
							json: {
								text: user.firstName + " " + user.lastName + " has RSVPed for LAN " + req.params.year + " (see the <https://www.3akm.com/appearances|full RSVP list>)"
							}
						}, function(err, res, body){
							if(err){
								log.warn("Slack notification failed with code: " + err.code + ".");
							}
						});
					}
				});
			}
		}).catch(function(){
			rsvp = new Rsvp();
			rsvp.user = req.params.user;
			rsvp.lan = lan._id;
			rsvp.status = req.body.status;
			rsvp.playing = req.body.playing;
			rsvp.guests = req.body.guests;
			rsvp.cleaning = req.body.cleaning;
			rsvp.tournaments = req.body.tournaments;
			rsvp.bringingFood = req.body.bringingFood;
			rsvp.save(function(err){
				if(err){
					res.status(400).end();
				}else{
					res.status(201)
					.location(prefix + "/" + req.params.year)
					.end();
				}
			});
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
		.exec()
		.then(function(lan){
			if(!lan) throw 404;
			return Rsvp.findOne({user: req.params.user, lan: lanDoc._id});
		}).then(function(rsvp){
			if(!rsvp) throw 404;
			rsvp.attended = true;
			return rsvp.save();
		}).then(function(){
			res.status(200).end();
		}).catch(handleError(res));
	});
};
