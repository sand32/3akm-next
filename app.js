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

var express = require("express"),
	session = require("express-session"),
	http = require("http"),
	https = require("https"),
	fs = require("fs"),
	cors = require("cors"),
	bodyParser = require("body-parser"),
	cookieParser = require("cookie-parser"),
	passport = require("passport"),
	mongoose = require("mongoose"),
	authentication = require("./authentication.js"),
	routes = require("./routes/routes.js"),
	startup = require("./utils/startup.js"),
	app = express(),
	config = require("./utils/common.js").config,
	log = require("./utils/log.js"),
	corsOptions, server;

// Establish database connection
if(config.dbUser){
	mongoose.connect("mongodb://" + config.dbUser + ":" + 
									config.dbPassword + "@" + 
									config.dbAddress + "/" + 
									config.dbName);
}else{
	mongoose.connect("mongodb://" + config.dbAddress + "/" + config.dbName);
}
mongoose.connection.on("error", function(e){
	console.error(e.name + ": " + e.message);
});

// Declare view engine
app.set("views", __dirname + "/views");
app.set("view engine", "jade");

// Define CORS policy
corsOptions = {
	origin: function(origin, callback){
		var originIsWhitelisted = config.corsWhitelist.indexOf(origin) !== -1;
		callback(null, originIsWhitelisted);
	}
};
app.use(cors(corsOptions));

// Define session
app.use(cookieParser(config.cookieSecret));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
	secret: config.sessionSecret,
	resave: true,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Define authentication method
authentication();

// Define routes
routes(app);

// Other startup tasks (initializing DB values, etc.)
startup.initializeDatabase();
startup.bundleClientJS();

if(config.cert !== "changeme"
&& config.key !== "changeme"){
	server = https.createServer({
		cert: fs.readFileSync(config.cert),
		key: fs.readFileSync(config.key)
	}, app);
}else{
	server = http.createServer(app);
}

// Go
server.listen(config.port);

log.log("----------------------------------------------------------------------");
log.log("                       Initialization Complete");
log.log("----------------------------------------------------------------------");
