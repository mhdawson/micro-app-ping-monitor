# micro-app-ping-monitor

Micro-app to monitor remote hosts and alert and take action when
hosts are not responding.

It allows one or more monitor instances to be defined, each with
one or more hosts to be monitored.  If more than one host is
configured for an instance it can be "all" or "any".  In the case of
all, all of the hosts must respond or an alert is signaled. In
the case of "any" then only if none of the hosts are available
will an alert be signaled.

I use it to monitor my internet connectivity and to automatically
power on/off the modem in the case of failure, as well as to
monitor a number of cloud virtual machines.

Logging can be configured to send an sms message on a "error"
log message which results in a sms message when an alert
is signaled.

For each monitor instance, you configure the size and positioning
of the element for the monitor instance.  It will have the
text you provide and be green by default.  When the configured
condition is detected it will change to yellow and then after
the altert time interval it will go to red and an alert will
be signaled.

The following is an example of one of the configurations that
I'm using:

![pingmonitor1](https://github.com/mhdawson/micro-app-ping-monitor/blob/master/pictures/pingmonitor1.jpg?raw=true)

which has 7 monitor instances configured.

Given that you can configure the monitor instances, size of the main window and the size of the element for each instance you can easily configure many different types of monitor apps.

When an alert is signaled you can also configure one or more commands to be invoked.  Currently commands are messages posted
to an mqtt topic.  In the future additional command types may be addded. By using projects like [PI433WirelessTXManager](https://github.com/mhdawson/PI433WirelessTXManager) you can trigger actions like a power cycle to occur when an
alert triggers.

In addition to showing the status of the monitor instances, the GUI for the micro-app also allows you to view the log which records the state changes for the monitor instances.  The following is an example of the log display:

![pingmonitor2](https://github.com/mhdawson/micro-app-ping-monitor/blob/master/pictures/pingmonitor2.jpg?raw=true)

# Usage

After installation modify ../lib/config.json to match your configuration

The configuration entries that must be updated include:

* windowSize - object with x and y fields which specifies the
  overall size of the GUI window for the micro-app-framework.
* monitorInstances - array of one or more monitorInstance
  objects as specified below.
* serverPort - port on which the server will listen.
* mqttServerUrl: - url for mqtt server on which commands will
  be posted when alerts are triggered.
* twilio - object which contains fields for twilio configuration
  used to send sms messages as described below
* eventLogPrefix - path to the directory in which the event log
  file will be stored.

Each monitorInstance has the following fields:

* name - name assigned to the monitor instance. Used in log
  messages.
* button - object with size, position and label fields.  size
  and position fields have x and y fields which specify the size
  and position of the element (in pixels) in the GUI for the
  monitor instance.  The label field should be a string with
  the lable that will be used in the GUI for the monitor instance.
* checks - array with one or more hosts to check.  Each hosts
  entry is an object with host and port fields.  For example to
  check for ssh connectivity to host foo, host = "foo" and
  port = 22.
* commands - arary of one or more command objects as
  described below to be invoked when  an alerts is triggered
* type - one of the string "all" or "any".
* pingInterval - the interval in milliseconds at which
  the connectivity checks will be made.
* alertTime - the time in milliseconds after which an alertTime
  will be triggered if the conectivity checks have failed
  continuously.

Each command object has the following fields:

* delay - (optional) the delay after the alert is triggered
  that the the command will be invoked.
* topic - the mqtt topic on which the message will be posted.
* message - the message to be posted to the mqtt topic.

The twilio object has the following fields:

* sendError - send an sms message when an log message at the
  "error" level is logged.
* accountSID - your twilio account ID.
* accountAuthToken - your twilio auth token.
* toNumber - number to which an sms will be sent.
* fromNumber - your twilio from number.

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
  "useLaunchWindow": "false",
  "mqttServerUrl": "tcp://XX.XX.XX.XX:1883",
  "twilio": { "sendError": true,
              "accountSID": "XXXX",
              "accountAuthToken": "XXXX",
              "toNumber": "XXXXXXXXXXX" , "fromNumber": "XXXXXXXXXX" },
  "eventLogPrefix" : "/home/user1/ping/micro-app-ping-monitor"
}
```
