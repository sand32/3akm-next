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
	httpLog = require("./utils/common.js").httpLog,
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
app.set("view engine", "pug");

// Define CORS policy
corsOptions = {
	origin: function(origin, callback){
		var originIsWhitelisted = config.corsWhitelist.indexOf(origin) !== -1;
		callback(null, originIsWhitelisted);
	}
};
app.use(cors(corsOptions));

app.use(httpLog);

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
