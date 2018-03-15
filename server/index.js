
 // [LOAD PACKAGES]
//const path = require("path");
const express = require("express");
//const bodyParser = require("body-parser");
const app = express();

// [CONFIGURE SOCKET]
const server = require("http").createServer(app);
var socketio = require("./socket")(server);

// [CONFIGURE SECURITY-POLICY]
securitySetup = function(app) {
    var connectSources, helmet, scriptSources, styleSources;
    helmet = require("helmet");
    app.use(helmet());
    app.use(helmet.hidePoweredBy());
    app.use(helmet.noSniff());
    app.use(helmet.crossdomain());
    scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", "ajax.googleapis.com"];
    styleSources = ["'self'", "'unsafe-inline'", "ajax.googleapis.com"];
    connectSources = ["'self'", "ws://localhost:3000"]
    return app.use(helmet.contentSecurityPolicy({
      defaultSrc: ["'self'"],
      scriptSrc: scriptSources,
      styleSrc: styleSources,
      connectSrc: connectSources,
      reportUri: '/report-violation',
      reportOnly: false,
      setAllHeaders: false,
      safari5: false
    }));
  };
// [console]
console.log("uncytick module start")

module.exports = app;

