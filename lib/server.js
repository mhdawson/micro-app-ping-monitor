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
const mqtt = require('mqtt');


// constants
const PAGE_HEIGHT = 300;
const PAGE_WIDTH = 300;


// this is filled in later as the socket io connection is established
var eventSocket;


var Server = function() {
}


Server.getDefaults = function() {
  return { 'title': 'Ping Monitor' };
}


var replacements;
Server.getTemplateReplacments = function() {

  var monitorInstances = Server.config.monitorInstances;

  // create the html for the buttons
  var buttons = new Array();
  for (var i = 0; i < monitorInstances.length; i++) {
    entry = monitorInstances[i];
    if (entry.button !== undefined) {
      buttons[i] = '    <div id="button' + i + '" style="position: absolute; ' +
                   'width:' + entry.button.size.x + 'px; ' +
                   'height:' + entry.button.size.y + 'px; ' +
                   'top:' + entry.button.position.y + 'px; ' +
                   'left:' + entry.button.position.x + 'px; ' +
                   'text-align: center; ' +
                   'vertical-align: middle; ' +
                   '" ' +
                   'onclick="sendButton(' + i + ');" ' +
                   '>' + entry.button.label +  '</div>';
    } else {
      buttons[i] = '';
    }
  }

  if (replacements === undefined) {
    var config = Server.config;
    replacements = [{ 'key': '<ALARM DASHBOARD TITLE>', 'value': config.title },
                    { 'key': '<UNIQUE_WINDOW_ID>', 'value': config.title },
                    { 'key': '<PAGE_WIDTH>', 'value': PAGE_WIDTH },
                    { 'key': '<PAGE_HEIGHT>', 'value': PAGE_HEIGHT },
                    { 'key': '<BUTTONS>', 'value': buttons.join("\n")}];

  }
  return replacements;
}

Server.startServer = function(server) {
  var config = Server.config;
  var connected = true;
  var alarmed = false;
  var lastGood = new Date();

  eventSocket = socketio.listen(server);

  // setup mqtt
  var mqttOptions;
  if (config.mqttServerUrl.indexOf('mqtts') > -1) {
    mqttOptions = { key: fs.readFileSync(path.join(__dirname, 'mqttclient', '/client.key')),
                    cert: fs.readFileSync(path.join(__dirname, 'mqttclient', '/client.cert')),
                    ca: fs.readFileSync(path.join(__dirname, 'mqttclient', '/ca.cert')),
                    checkServerIdentity: function() { return undefined }
    }
  }

  var mqttClient = mqtt.connect(config.mqttServerUrl, mqttOptions);

  var sendCommand = function(command) {
    try {
      mqttClient.publish(command.topic, command.message);
      eventLog.logMessage(config, 'Schedule event, topic[' + command.topic + '] message [' + command.message + ']', eventLog.LOG_INFO);
    } catch (e) {
      // we must not be connected to the mqtt server at this
      // point just log an error
      eventLog.logMessage(config, 'failed to publish message', eventLog.LOG_WARN);
    }
  }


  eventSocket.on('connection', function(ioclient) {
    for (var k = 0; k < states.length; k++) {
      emitState(states[k]);
    }
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

  var states = new Array();

  var emitState = function(state) {
    eventSocket.emit('data', {'type': 'ENTRY_STATUS', 'buttonId': state.id, "state": state.visualState});
  }

  var setVisualState = function(state, value) {
     state.visualState = value;
     emitState(state);
  }

  for (var j = 0; j < monitorInstances.length; j++) {
    var state = states[j] = new Object();
    var entry = monitorInstances[j];

    state.id = 'button' + j;
    state.connected = true;
    state.alarmed = false;
    state.lastGood =  new Date();
    state.visualState = 'GREEN';

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
        if (state.alarmed !== true) {
          setVisualState(state, 'AMBER');
          if (((new Date()) - state.lastGood) > entry.alertTime) {
            if (state.alarmed === false) {
              eventLog.logMessage(config, 'No connectivity:' + entry.name, eventLog.LOG_ERROR);
              // now take the configured actions
              var commands = entry.commands;
               for( var j = 0; j < commands.length; j++) {
                 setTimeout(function(command) {
                   sendCommand(command);
                 }.bind(undefined, commands[j]), commands[j].delay);
               }
               state.alarmed = true;
               setVisualState(state, 'RED');
            }
          }
        }
      } else {
        if (state.alarmed === true) {
          eventLog.logMessage(config, 'Connectivity restored:' + entry.name, eventLog.LOG_INFO);
        }
        setVisualState(state, 'GREEN');
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
