#!/usr/bin/env node

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var fs = require('fs');
var jade = require('jade');
var path = require('path');
var querystring = require('querystring');
var body = require('/srv/lib/js/body');
var lockFile = require('/srv/lib/js/lockfile');

var dbPath = "/srv/srv/announce/database.json";
var lockPath = "/srv/var/lock/announce.lock";

if (process.env.REQUEST_METHOD == 'POST') {
  body.parse(process.stdin, function(err, qs) {
    if (err || !qs) {
      return console.log("Status: 500\n");
    }

    try {
      lockFile.lockSync(lockPath);
    } catch (e) {
      return console.log("Status: 500\n");
    }

    var db = require(dbPath);
    
    try {
      fs.writeFileSync(dbPath, JSON.stringify(db));
    } catch (e) {
      return console.log("Status: 500\n");
    }

    console.log("Status: 200\nContent-type: text/plain\n\n")

    lockFile.unlockSync(lockPath);
  });

  return;
}

console.log("Status: 200");
console.log("Content-Type: text/html");
console.log("");

var db = require(dbPath);
var fn = jade.compileFile('templates/index.jade');
var qs = querystring.parse(process.env.QUERY_STRING);

console.log(fn({
  'path': '/home/server/sandbox/announce',
  'user': process.env.USER,
  'authorized': process.env.USER != 'guest',
  'db': db
}));
