/*
-----------------------------------------------------------------------------
Copyright (c) 2014 Seth Anderson

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
	path = require("path");

module.exports = function(app){
	var userApiRoutes = require("./userapi.js"),
		articleApiRoutes = require("./articleapi.js"),
		lanApiRoutes = require("./lanapi.js"),
		gameApiRoutes = require("./gameapi.js"),
		uploadRoutes = require("./uploadapi.js")
		clientRoutes = require("./client.js");

	userApiRoutes(app, "/api/user");
	articleApiRoutes(app, "/api/article");
	lanApiRoutes(app, "/api/lan");
	gameApiRoutes(app, "/api/game");
	uploadRoutes(app, "/api/upload");
	clientRoutes(app, "");

	app.use(express.static('public'));

	app.use(function(req, res){
		res.status(404).end();
	});
}
