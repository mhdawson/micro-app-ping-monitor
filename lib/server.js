// Copyright 2016 the project authors as listed in the AUTHORS file.
// All rights reserved. Use of this source code is governed by the
// license that can be found in the LICENSE file.
const ping = require('tcp-ping');
const config = require('./config.json');
const path = require('path');
const fs = require('fs');
const twilio = require('twilio');
const socketio = require('socket.io');
const microAppFramework = require('micro-app-framework');


// constants
const PAGE_HEIGHT = 100;
const PAGE_WIDTH = 100;


// this is filled in later as the socket io connection is established
var eventSocket;


var Server = function() {
}


Server.getDefaults = function() {
  return { 'title': 'Ping Monitor' };
}


var replacements;
Server.getTemplateReplacments = function() {
  if (replacements === undefined) {
    var config = Server.config;
    replacements = [{ 'key': '<ALARM DASHBOARD TITLE>', 'value': config.title },
                    { 'key': '<UNIQUE_WINDOW_ID>', 'value': config.title },
                    { 'key': '<PAGE_WIDTH>', 'value': PAGE_WIDTH },
                    { 'key': '<PAGE_HEIGHT>', 'value': PAGE_HEIGHT }];

  }
  return replacements;
}

Server.startServer = function(server) {
  var config = Server.config;

  eventSocket = socketio.listen(server);

  eventSocket.on('connection', function(ioclient) {
  });


  var connected = true;

  var doCheck = function() {
    connected = false;

    for (var i = 0; i< config.checks.length; i++ ) {
      ping.probe(config.checks[i].host, config.checks[i].port, function(err, available) {
        if ((err === undefined) && (available === true)) {
          connected = true;
        }
      });
    }
  }


  var lastGood = new Date();
  setInterval(function() {
    if (connected === false) {
      console.log(new Date() + ": No connectivity");
      if (((new Date()) - lastGood) > config.alertTime) {
        console.log('ALERT ALERT');
      }
    } else {
      lastGood = new Date();
    }

    doCheck();
  }, config.pingInterval);
};


if (require.main === module) {
  microAppFramework(path.join(__dirname), Server);
}

module.exports = Server;
