module.exports = function(app){
    var apiRoutes = require("./api.js"),
        clientRoutes = require("./client.js");
    apiRoutes(app, "/api");
    clientRoutes(app, "");

    app.get("/hello", function(req, res){
        res.send("Hi! :D");
    });

    app.use(function(req, res){
        res.send(404);
    });
}

