#!/usr/bin/env node

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var fs = require('fs');
var jade = require('jade');
var path = require('path');
var querystring = require('querystring');
var body = require('/srv/lib/js/body');
var lockFile = require('/srv/lib/js/lockfile');

var eventsPath = "/srv/srv/events/events.json";
var lockPath = "/srv/var/lock/events.lock";

if (process.env.REQUEST_METHOD == 'POST') {
  body.parse(process.stdin, function(err, qs) {
    if (err || !qs) {
      return console.log("Status: 500\n");
    }

    if (qs.user && process.env.USER != qs.user) {
      return console.log("Status: 500\n");
    }

    if (qs.email && (qs.email || "").indexOf("@") == -1) {
      return console.log("Status: 500\n");
    }
   
    try {
      lockFile.lockSync(lockPath);
    } catch (e) {
      return console.log("Status: 500\n");
    }

    var events = require(eventsPath);
    var ev = events.filter(function(e) { return e.id == qs.id; });
    var endpoint = qs.email ? 'email:' + qs.email : 'user:' + process.env.USER;

    if (!ev || ev.length != 1) {
      return console.log("Status: 500\n");
    } else {
      ev = ev[0];
    }

    var i = ev.rsvp.indexOf(endpoint)
    
    if (i == -1) {
      ev.rsvp.push(endpoint);
    } else {
      ev.rsvp.splice(i, 1);
    }
    
    try {
      fs.writeFileSync(eventsPath, JSON.stringify(events, null, 4));
    } catch (e) {
      return console.log("Status: 500\n");
    }

    console.log("Status: 200\nContent-type: text/plain\n\n")
    console.log(ev);

    lockFile.unlockSync(lockPath);
  });

  return;
}

console.log("Status: 200");
console.log("Content-Type: text/html");
console.log("");

var fn = jade.compileFile('templates/index.jade');
var events = require(eventsPath);
var qs = querystring.parse(process.env.QUERY_STRING);
var focus = qs.id;

events = events.filter(function(a) {
  return a.id == focus || Date.parse(a.timestamp) >= Date.now();
}).sort(function(a, b) {
  return (a.id == focus ? -1 : (b.id == focus ? 1 : Date.parse(a.timestamp) - Date.parse(b.timestamp)));
});

console.log(fn({
  'user': process.env.USER,
  'focus': focus,
  'events': events
}));
