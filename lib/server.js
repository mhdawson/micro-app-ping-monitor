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
const eventLog = require('./eventLog.js');


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
  var connected = true;
  var alarmed = false;
  var lastGood = new Date();

  eventSocket = socketio.listen(server);

  eventSocket.on('connection', function(ioclient) {
  });

  eventLog.logMessage(config, 'Ping monitor starting', eventLog.LOG_INFO);

  var monitorInstances = config.monitorInstances;

  var setCheckStartingState = function(state, entry) {
    if (entry.type === 'any') {
      state.connected = false;
    } else if (entry.type === 'all') {
      state.connected = true;
    }
  }

  var states = new Object();

  for (var j = 0; j < monitorInstances.length; j++) {
    var state = states[j] = new Object();
    var entry = monitorInstances[j];

    state.connected = true;
    state.alarmed = false;
    state.lastGood =  new Date();

    var doCheck = function(state, entry) {
      setCheckStartingState(state, entry);
      for (var i = 0; i < entry.checks.length; i++ ) {
        ping.probe(entry.checks[i].host, entry.checks[i].port, function(err, available) {
          if ((err === undefined) && (available === true)) {
            if (entry.type === 'any') {
              state.connected = true;
            }
          } else {
            if (entry.type === 'all') {
              state.connected = false;
            }
          }
        });
      }
    }

    setInterval(function(state, entry) {
      if (state.connected === false) {
        eventLog.logMessage(config, 'Connectivity check failed:' + entry.name, eventLog.LOG_WARN);
        if (((new Date()) - state.lastGood) > entry.alertTime) {
          if (state.alarmed === false) {
            eventLog.logMessage(config, 'No connectivity:' + entry.name, eventLog.LOG_ERROR);
          }
          state.alarmed = true;
        }
      } else {
        if (state.alarmed === true) {
          eventLog.logMessage(config, 'Connectivity restored:' + entry.name, eventLog.LOG_INFO);
        }
        state.alarmed = false;
        state.lastGood = new Date();
      }

      doCheck.bind(null, state, entry)();
    }.bind(null, state, entry), entry.pingInterval);
  }
};


if (require.main === module) {
  microAppFramework(path.join(__dirname), Server);
}

module.exports = Server;
