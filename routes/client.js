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

var express = require("express"),
	authenticate = require("../utils/common.js").authenticate,
	authorize = require("../authorization.js").authorize,
	config = require("../utils/common.js").config,
	log = require("../utils/log.js");

module.exports = function(app, prefix){
	app.get(prefix + "/partial/registrationform", function(req, res){
		res.render("partial/registrationform.jade", {
			recaptchaSiteKey: config.recaptchaSiteKey
		});
	});

	app.get(prefix + "/partial/*", function(req, res){
		if(config.debugMode){
			res.render("partial/" + req.params[0] + ".jade");
		}else{
			res.render("partial/" + req.params[0] + ".jade", {}, function(err, html){
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
			.then(
				function(){
					res.render("admin", {
						analyticsTrackingId: config.analyticsTrackingId
					});
				},
				function(error){
					log.error(error);
					res.status(500).end();
				}
			);
		}else{
			res.render("admin", {
				analyticsTrackingId: config.analyticsTrackingId
			});
		}
	});

	app.get(prefix + "*", function(req, res){
		if(config.debugMode){
			var startup = require("../utils/startup.js");
			startup.bundleClientJS()
			.then(
				function(){
					res.render("frontend", {
						analyticsTrackingId: config.analyticsTrackingId
					});
				},
				function(error){
					log.error(error);
					res.status(500).end();
				}
			);
		}else{
			res.render("frontend", {
				analyticsTrackingId: config.analyticsTrackingId
			});
		}
	});
}
