const ping = require('tcp-ping');
const config = require('./config.json');


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
