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

var confidence = function(pos, neg) {
    var n = pos + neg;
    var z = 1.6;
    var phat;

    if (!n) {
      return 0;
    }
    
    phat = pos / n;

    return Math.sqrt(phat+z*z/(2*n)-z*((phat*(1-phat)+z*z/(4*n))/n))/(1+z*z/n);

};

var getScore = function(stats) {
  return confidence(stats.good, stats.bad);
};

var getGrade = function(score) {
  var grades = ['F', 'D', 'C', 'B', 'A'];
  return grades[Math.round((grades.length - 1) * score)];
};


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

var stats = {
  'good': 0,
  'bad': 0,
  'meh': 120,
  'limit': 100
};

var total = 100;
var score = getScore(stats);
var grade = getGrade(score); 

console.log(fn({
  'path': '/home/server/sandbox/announce',
  'user': process.env.USER,
  'total': total,
  'stats': stats,
  'grade': grade,
  'score': score,
  'authorized': process.env.USER != 'guest',
  'db': db
}));
