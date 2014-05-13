var express = require("express"),
    config = require("./config/config.js"),
    routes = require("./routes/routes.js");
    app = express();

routes(app);
app.listen(config.port);

