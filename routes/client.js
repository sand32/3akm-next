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

var express = require("express"),
	authenticate = require("../utils/common.js").authenticate,
	authorize = require("../authorization.js").authorize,
	config = require("../utils/common.js").config,
	version = require("../utils/common.js").version,
	log = require("../utils/log.js");

module.exports = function(app, prefix){
	app.get(prefix + "/partial/registrationform", function(req, res){
		res.render("partial/registrationform.pug", {
			recaptchaSiteKey: config.recaptchaSiteKey
		});
	});

	app.get(prefix + "/partial/*", function(req, res){
		if(config.debugMode){
			res.render("partial/" + req.params[0] + ".pug");
		}else{
			res.render("partial/" + req.params[0] + ".pug", {}, function(err, html){
				if(err){
					res.redirect("/partial/404");
				}else{
					res.send(html);
				}
			});
		}
	});

	app.use(express.static('public'));

	app.get(prefix + "/admin*", 
		authenticate, 
		authorize({hasRoles: ["admin"]}), 
	function(req, res){
		if(config.debugMode){
			var startup = require("../utils/startup.js");
			startup.bundleClientJS()
			.then(function(){
				res.render("admin", {
					analyticsTrackingId: config.analyticsTrackingId,
					version: version
				});
			}).catch(function(error){
				log.error(error);
				res.status(500).end();
			});
		}else{
			res.render("admin", {
				analyticsTrackingId: config.analyticsTrackingId,
				version: version
			});
		}
	});

	app.get(prefix + "*", function(req, res){
		if(config.debugMode){
			var startup = require("../utils/startup.js");
			startup.bundleClientJS()
			.then(function(){
				res.render("frontend", {
					analyticsTrackingId: config.analyticsTrackingId,
					debugMode: config.debugMode
				});
			}).catch(function(error){
				log.error(error);
				res.status(500).end();
			});
		}else{
			res.render("frontend", {
				analyticsTrackingId: config.analyticsTrackingId,
				debugMode: config.debugMode
			});
		}
	});
};
