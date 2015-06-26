#!/usr/bin/env node

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var _ = require('/srv/lib/js/lodash');
var fs = require('fs');
var jade = require('jade');
var path = require('path');
var querystring = require('querystring');
var body = require('/srv/lib/js/body');
var lockFile = require('/srv/lib/js/lockfile');

var dbPath = "/srv/srv/announce/database.json";
var lockPath = "/srv/var/lock/announce.lock";

var db = require(dbPath);
var qs = querystring.parse(process.env.QUERY_STRING);
var user = process.env.USER;
var dirty = false;

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

var setProfile = function(db, user, profile) {
  db.users[user] = profile;
};

var getProfile = function(db, user) {
    return _.defaults(db.users[user] || {}, {
        "reputation": {
            "good": 0,
            "bad": 0,
            "ignore": 0,
            "score": 0
        },
        "topics": ["#general"]
    });
};

var popToken = function(db, token) {
    var result = db.tokens[token];
};

var handlePost = function(scope, cb) {
  body.parse(process.stdin, function(err, qs) {
    if (err || !qs) {
      scope.msg = err;
      return cb(scope);
    }
    
    switch(qs.task) {
      case "save_topics":
        scope.msg = "SAVE TOPICS";
        break;

      case "announce":
        scope.msg = "ANNOUNCEMENT";
        break;
    }

    cb(scope);
  });

  return true;
};

var lockDatabase = function() {
  try {
    lockFile.lockSync(lockPath);
  } catch (e) {
    console.log("Status: 500\n");
    return false;
  }
};

var unlockDatabase = function(save) {
  if (false && save) {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(db));
    } catch (e) {
      console.log("Status: 500\n");
      return false;
    }
  }

  lockFile.unlockSync(lockPath);
};

var handleToken = function(scope, cb) {
    var token = popToken(db, qs.token);

    if (!token || !token.user || !token.action) {
        scope.msg = "This link is no longer valid.";
    } else {
      scope.ok = false;
    }

    return cb(scope);
};

var renderPage = function(scope) {
    var fn = jade.compileFile('templates/index.jade');

    console.log("Status: 200");
    console.log("Content-Type: text/html");
    console.log("");

    profile = getProfile(db, user);
    
    var total = 100;
    var score = getScore(profile.reputation);
    var grade = getGrade(score); 
    
    console.log(fn({
      'path': '/home/server/sandbox/announce',
      'message': scope.msg,
      'user': user,
      'total': total,
      'profile': profile,
      'topics': profile.topics.join("\n"),
      'grade': grade,
      'score': score,
      'authorized': process.env.USER != 'guest',
      'db': db
    }));
};

var main = function() {
    var scope = {
      'ok': true,
      'msg': ''
    };
    
    var finish = function(scope) {
      if (scope.ok) {
        renderPage(scope);
      }
    
      unlockDatabase(dirty);
    };

    lockDatabase();

    if (process.env.REQUEST_METHOD == "POST") {
        handlePost(scope, finish);
    } else if (qs.token) {
        handleToken(scope, finish);
    } else {
      finish(scope);
    }
};

main();
