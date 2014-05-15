module.exports = function(app, prefix){
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");

    app.get(prefix + "/", function(req, res){
        //res.render("index");
        res.send("<h1>Ima page!</h1>");
    });
}

