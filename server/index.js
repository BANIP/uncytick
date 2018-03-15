
 // [LOAD PACKAGES]
//const path = require("path");
const express = require("express");
//const bodyParser = require("body-parser");
const app = express();

// [CONFIGURE SOCKET]
const server = require("http").createServer(app);
var socketio = require("./socket")(server);

// [CONFIGURE SECURITY-POLICY]
app.use(helmet.csp({
    'default-src': ["'self'"],
    'connect-src': [
      "'self'" , "blob:",
      'wss:',
      'websocket.domain',
    ],
    'font-src': ["'self'",'s3.amazonaws.com',"maxcdn.bootstrapcdn.com"],
    'img-src': ["'self'", 'data:'],
    'style-src': ["'self'","maxcdn.bootstrapcdn.com",'s3.amazonaws.com',"'unsafe-inline'"],
    'script-src': ["'self'","'unsafe-inline'","'unsafe-eval'",'blob:'],
    reportOnly: false,
    setAllHeaders: false,
    safari5: false
  }))
  
// [console]
console.log("uncytick module start")

module.exports = app;

