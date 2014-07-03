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
    bodyParser = require("body-parser"),
    possport = require("passport"),
    auth = require("./auth.js"),
    config = require("./config/config.js"),
    routes = require("./routes/routes.js");
    app = express();

// Declare view engine
app.set("views", __dirname + "/views");
app.set("view engine", "jade");

// Define session
app.use(express.cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.session({secret: config.sessionSecret}));
app.use(passport.initialize());
app.use(passport.session());

// Define authentication method
auth();

// Define routes
routes(app);
app.use(express.static(__dirname + "/public"));

// Go
app.listen(config.port);

