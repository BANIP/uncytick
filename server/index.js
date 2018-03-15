module.exports = function(server){

    // [LOAD PACKAGES]
    //const path = require("path");
    const express = require("express");
    //const bodyParser = require("body-parser");
    const app = express();
    const path = require("path");

    const staticpath = path.resolve(__dirname,"../public");

    app.use(express.static(staticpath))
    // [CONFIGURE SOCKET]
    var socketio = require("./socket")(server);

    /*
    server.listen(8080,(req,res) => {
        console.log("Express server has started on port 8080");
    });
    */

    return app;
}

