
 // [LOAD PACKAGES]
//const path = require("path");
const express = require("express");
//const bodyParser = require("body-parser");
const app = express();

// [CONFIGURE SOCKET]
const server = require("http").createServer(app);
var socketio = require("./socket")(server);

// [console]
console.log("uncytick module start")

module.exports = app;

