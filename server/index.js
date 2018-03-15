
 // [LOAD PACKAGES]
//const path = require("path");
const express = require("express");
//const bodyParser = require("body-parser");
const app = express();

// [CONFIGURE SOCKET]
const server = require("http").createServer(app);
var socketio = require("./socket")(server);

// [CONFIGURE ROUTER]

// [console]
console.log("sketch module start")

module.exports = app;

