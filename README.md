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
