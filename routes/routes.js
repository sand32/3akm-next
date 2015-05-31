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
	path = require("path"),
	loadConfig = require("../utils/common.js").loadConfig,
	config = loadConfig(__dirname + "/../config/config.json");

module.exports = function(app){
	var userApiRoutes = require("./userapi.js"),
		articleApiRoutes = require("./articleapi.js"),
		lanApiRoutes = require("./lanapi.js"),
		gameApiRoutes = require("./gameapi.js"),
		rsvpApiRoutes = require("./rsvpapi.js"),
		storeApiRoutes = require("./storeapi.js"),
		uploadRoutes = require("./uploadapi.js"),
		serviceRoutes = require("./services/serviceroutes.js"),
		clientRoutes = require("./client.js");

	userApiRoutes(app, "/api/user");
	articleApiRoutes(app, "/api/article");
	lanApiRoutes(app, "/api/lan");
	gameApiRoutes(app, "/api/game");
	rsvpApiRoutes(app, "/api/user/:user/rsvp", "/api/rsvp");
	storeApiRoutes(app, "/api/store");
	uploadRoutes(app, "/api/upload");
	serviceRoutes(app, "/api/service");
	clientRoutes(app, "/partial");

	app.use(express.static('public'));

	app.get("*", function(req, res){
		if(config.debugMode){
			var startup = require("../utils/startup.js");
			startup.bundleClientJS()
			.then(
				function(){
					res.render("frontend");
				},
				function(){
					res.status(500).end();
				}
			);
		}else{
			res.render("frontend");
		}
	});
}
