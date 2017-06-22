# micro-app-ping-monitor

Micro-app to monitor remote hosts and to alert and take action when
hosts are not responding. Its obviously not a replacement for
a full featured monitoring tool but is handy if you want to monitor a small number of hosts and automtically be notified or
take action when they are not responding.

It allows one or more monitor instances to be defined, each with
one or more hosts to be monitored.  If more than one host is
configured for an instance it can be of type "all" or "any".  In the case of all, all of the hosts must respond or an alert is signaled. In
the case of "any" an alert is triggered only if none of the hosts are available.

I use it to monitor my internet connectivity and to automatically
power off/on the modem in the case of failure, monitor my website, as well as to monitor a number of cloud virtual machines.

Logging can be configured to send an sms message on a "error"
log message which results in a sms message when an alert
is triggered.

For each monitor instance, you configure the size and positioning
of the element for the monitor instance in the GUI.  It will have the
text you provide as the label and be green by default.  When the configured condition is detected it will change to yellow and
then after the alert time interval it will go to red and an
alert will be triggered.

The following is an example of one of the configurations that
I'm using which as 7 monitor instances configured:

![pingmonitor1](https://github.com/mhdawson/micro-app-ping-monitor/blob/master/pictures/pingmonitor1.jpg?raw=true)

Given that you can configure the monitor instances, size of the main window and the size of the element for each instance you can easily configure many different types of monitor apps.

When an alert is triggered you can also configure one or more commands to be invoked.  Currently commands are messages posted
to an mqtt topic (I'm planning to add additional command types in the
future). By using projects like [PI433WirelessTXManager](https://github.com/mhdawson/PI433WirelessTXManager) you can trigger actions like a power cycle to occur when an
alert triggers.

In addition to showing the status of the monitor instances, the GUI for the micro-app also allows you to view the log which records the state changes for the monitor instances.  The following is an example of the log display:

![pingmonitor2](https://github.com/mhdawson/micro-app-ping-monitor/blob/master/pictures/pingmonitor2.jpg?raw=true)

You can toggle between showing the status for the monitor instances and the log using the button provided at the bottom of the GUI.

# Usage

After installation modify ../lib/config.json to match
your configuration.

The configuration entries that must be updated include:

* windowSize - object with x and y fields which specifies the
  overall size of the GUI window for the micro app.
* monitorInstances - array of one or more monitorInstance
  objects as specified below.
* serverPort - port on which the server will listen.
* mqttServerUrl: - url for mqtt server on which commands will
  be posted when alerts are triggered.
* notify- object which contains fields for sending notificaitons
  as described below.
* eventLogPrefix - path to the directory in which the event log
  file will be stored.

Each monitorInstance has the following fields:

* name - name assigned to the monitor instance. Used in log
  messages.
* button - object with size, position and label fields.  size
  and position fields have x and y fields which specify the size
  and position of the element (in pixels) in the GUI for the
  monitor instance.  The label field should be a string with
  the label that will be used in the GUI for the monitor instance.
* checks - array with one or more hosts to check.  Each hosts
  entry is an object with host and port fields.  For example to
  check for ssh connectivity to host foo, host = "foo" and
  port = 22.
* commands - arary of one or more command objects as
  described below to be invoked when an alert is triggered.
* type - one of "all" or "any".
* pingInterval - the interval in milliseconds at which
  the connectivity checks will be made.
* alertTime - the time in milliseconds after which an alert
  will be triggered if the conectivity checks have failed
  continuously.

Each command object has the following fields:

* delay - (optional) the delay after the alert is triggered
  that the the command will be invoked.
* topic - the mqtt topic on which the message will be posted.
* message - the message to be posted to the mqtt topic.

The notify object has the following fields:

* mqttSmsBridge
  * enabled - set to true if you want notifications to
    be sent using this provider.
  * serverUrl - url for the mqtt server to which the
    bridge is connected.
  * topic - topic on which the bridge listens for
    notification requests.
  * certs - directory which contains the keys/certs
    required to connect to the mqtt server if the
    url is of type `mqtts`.

* voipms
  * enabled - set to true if you want notifications to
    be sent using this provider.
  * user - voip.ms API userid.
  * password - voip.ms API password.
  * did - voip.ms did(number) from which the SMS will be sent.
  * dst - number to which the SMS will be sent.

* twilio
  * enabled - set to true if you want notifications to
    be sent using this provider.
  * accountSID - twilio account ID.
  * accountAuthToken - twilio auth token.
  * toNumber - number to which the SMS will be sent.
  * fromNumber - number from which the SMS will be sent.

The following is an example of a configuration file with
some sensitive elements masked out:  

  ```
  {
  "windowSize": {"x": 200, "y": 256 },
  "monitorInstances": [
    { "name": "Internet availability",
      "button" : { "size": {"x": 198, "y": 30 },
                   "position": {"x": 1, "y": 0 },
                   "label": "Internet Avail" },
      "checks": [ { "host": "www.google.com", "port": 80 },
                  { "host": "myhost.com", "port": 22 }
                ],
      "commands": [ { "delay": 0, "topic": "home/2272/200", "message": "0F0F0FF00110" },
                    { "delay": 5000, "topic": "home/2272/200", "message": "0F0F0FF00110" },
                    { "delay": 30000, "topic": "home/2272/200", "message": "0F0F0FF00101" },
                    { "delay": 35000, "topic": "home/2272/200", "message": "0F0F0FF00101" },
                    { "delay": 40000, "topic": "home/2272/200", "message": "0F0F0FF00101" }
                  ],
      "type": "any",
      "pingInterval": 300000,
      "alertTime": 900000
    },
    { "name": "My website",
      "button" : { "size": {"x": 198, "y": 30 },
                   "position": {"x": 1, "y": 32 },
                   "label": "website" },
      "checks": [ { "host": "www.mywebsite.com", "port": 80 }
                ],
      "type": "all",
      "pingInterval": 300000,
      "alertTime": 900000
    }
  ],
  "serverPort": 3001,
  "mqttServerUrl": "tcp://X.X.X.X:1883",
  "notify": {
    "mqttSmsBridge": { "enabled": true,
                       "serverUrl": "mqtt:X.X.X.X:1883",
                       "topic": "house/sms" }
  },
  "eventLogPrefix" : "/home/user1/ping/micro-app-ping-monitor"
}
```

# Installation

Simply run:

```
npm install micro-app-ping-monitor
```

# Running

To run the ping-monitor micro-app, add node.js to your path (currently required 4.x or better) and then run:

```
npm start
```

# Key dependencies

## micro-app-framework
As a micro-app the micro-app-ping-monitor app depends on the micro-app-framework:

* [micro-app-framework npm](https://www.npmjs.com/package/micro-app-framework)
* [micro-app-framework github](https://github.com/mhdawson/micro-app-framework)

See the documentation on the micro-app-framework for more information on general configuration options (in addition to those documented in this readme) that are availble (ex using tls, authentication, serverPort, etc).

## tcp-ping

[tcp-ping](https://www.npmjs.com/package/tcp-ping) which is used to do the connectivity checks to the remote hosts.

## twilio

[Twilio](https://www.twilio.com/) which is used to send sms messaages.
