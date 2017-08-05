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

var Lan = require("../model/lan.js"),
	Rsvp = require("../model/rsvp.js"),
	User = require("../model/user.js"),
	authorize = require("../authorization.js").authorize,
	authorizeSessionUser = require("../authorization.js").authorizeSessionUser,
	authenticate = require("../utils/common.js").authenticate,
	sanitizeBodyForDB = require("../utils/common.js").sanitizeBodyForDB,
	checkObjectIDParam = require("../utils/common.js").checkObjectIDParam,
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
		checkObjectIDParam("rsvp"),
	function(req, res){
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
		checkObjectIDParam("rsvp"),
	function(req, res){
		Rsvp.findByIdAndUpdate(req.params.rsvp, req.body)
		.then(function(rsvp){
			if(!rsvp) throw 404;
			res.status(200).end();
		}).catch(handleError(res));
	});

	app.delete(prefix + "/:rsvp",
		authenticate,
		authorize({hasRoles: ["admin"]}),
		checkObjectIDParam("rsvp"),
	function(req, res){
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
		checkObjectIDParam("user"),
	function(req, res){
		Lan.findOne({
			active: true,
			acceptingRsvps: true
		})
		.$where("this.beginDate.getFullYear() === " + req.params.year)
		.exec()
		.then(function(lan){
			if(!lan) throw 404;
			return Rsvp.findOne({user: req.params.user, lan: lan._id});
		}).then(function(rsvp){
			if(!rsvp) throw 404;
			res.send(rsvp);
		}).catch(handleError(res));
	});

	app.put(prefix2 + "/:year",
		authenticate,
		authorizeSessionUser(),
		checkObjectIDParam("user"),
	function(req, res){
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
			if(!rsvp) throw {reason: "must-create-new"};
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
		}).catch(function(error){
			if(error === 404){
				res.status(404).end();
				return;
			}

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
		});
	});

	app.put(prefix2 + "/:year/attended",
		authenticate,
		authorizeSessionUser(),
		checkObjectIDParam("user"),
	function(req, res){
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
