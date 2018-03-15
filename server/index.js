
 // [LOAD PACKAGES]
//const path = require("path");
const express = require("express");
//const bodyParser = require("body-parser");
const app = express();
const path = require("path");

const staticpath = path.resolve(__dirname,"../public");

app.use(express.static(staticpath))
// [CONFIGURE SOCKET]
const server = require("http").createServer(app);
var socketio = require("./socket")(server);

// [console]
console.log("uncytick module start")

// server.listen(8000,() => console.log("start"))
module.exports = app

