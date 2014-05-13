module.exports = function(app){
    app.get("/hello", function(req, res){
        res.send("Hi! :D");
    });

    app.use(function(req, res){
        res.send(404);
    });
}

