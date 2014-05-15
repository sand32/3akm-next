var express = require("express"),
    config = require("./config/config.js"),
    routes = require("./routes/routes.js");
    app = express();

app.use(express.static(__dirname + "/public"));
routes(app);
app.listen(config.port);

