#!/usr/bin/env node

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var jade = require('jade');
var querystring = require('querystring');

var _ = require('/srv/lib/js/lodash');
var body = require('/srv/lib/js/body');
var passwd = require('/srv/etc/passwd.json');

var lib = require('./lib')

// Controller

var handleVote = function(scope, good, cb) {
  var profile = lib.getProfile(scope, scope.user);

  profile.reputation.good += (good && 1);
  profile.reputation.bad += (good || 1);
  profile.reputation.score = getScore(profile);

  scope.msg = (good ? "Upvote" : "Downvote") + " saved!";

  cb(scope);
};

var handleSaveTopics = function(scope, qs, cb) {
  var profile = lib.getProfile(scope, scope.user);

  profile.topics = lib.getTopics(qs.topics);
  
  if (profile.topics === null) {
    scope.msg = "Invalid topics.";
    return cb(scope);
  }

  lib.setProfile(scope, profile);

  scope.msg = "Topics saved.";
  cb(scope);
};

var handleAnnounce = function(scope, qs, cb) {
  var topics = lib.getTopics(qs.topics);
  var profile = lib.getProfile(scope, scope.user);
  var message = qs.message;

  scope.compose = { 'topics': _.map(topics, function(s) { return "#" + s; }).join(", "), 'message': message };
  
  if (topics === null || !topics.length) {
    scope.msg = "Invalid topics.";
    return cb(scope);
  }

  if (message.length < 50 || message.length > 25e3) {
    scope.msg = "Message too short or too long.";
    return cb(scope);
  }
    
  var prior = lib.lastAnnounce(scope, scope.user);
  var delta = lib.secondsElapsed(Date.parse(prior.timestamp), new Date());

  if (prior && delta < lib.coolDown) {
    scope.msg = "Please wait " + Math.round(lib.coolDown - delta) + " second(s) before posting this announcement.";
    return cb(scope);
  }

  var announce = lib.setAnnounce(scope, scope.user, topics, message);

  lib.queueAnnounce(scope, announce, profile.reputation.score);

  scope.msg = "Message queued!";
  cb(scope);
};

var handlePost = function(scope, cb) {
  body.parse(process.stdin, function(err, qs) {
    if (err || !qs) {
      scope.msg = err;
      return cb(scope);
    }
    
    switch(qs.task) {
      case "save_topics":
        handleSaveTopics(scope, qs, cb);
        break;

      case "announce":
        handleAnnounce(scope, qs, cb);
        break;
    }
  });

  return true;
};

var handleToken = function(scope, cb) {
    var token = lib.popToken(scope, qs.token);

    if (!token || !token.user || !token.action) {
      scope.msg = "This link is no longer valid.";
      return cb(scope);
    }
    
    switch(token.action.toLowerCase()) {
      case "good":
        return handleVote(scope, token.user, true, cb);

      case "bad":
        return handleVote(scope, token.user, false, cb);

      default:
        scope.msg = "This link is invalid.";
    }

    return cb(scope);
};

var renderPage = function(scope) {
    var fn = jade.compileFile('templates/index.jade');

    console.log("Status: 200");
    console.log("Content-Type: text/html");
    console.log("");

    profile = lib.getProfile(scope, scope.user);
    
    var score = profile.reputation.score;
    var grade = lib.getGrade(score); 
    
    console.log(fn({
      'uri': lib.appBaseURI,
      'message': scope.msg,
      'compose': scope.compose,
      'user': scope.user,
      'total': passwd.length,
      'profile': profile,
      'topics': _.map(profile.topics, function(s) { return "#" + s; }).join("\n"),
      'grade': grade,
      'score': score,
      'authorized': scope.user != 'guest',
    }));
};

var main = function() {
    var db = require(lib.dbPath);
    var qs = querystring.parse(process.env.QUERY_STRING);
    var user = process.env.USER;
    var scope = lib.getScope(db, user);
    
    if (user == "guest") {
      return renderPage(scope);
    }

    var finish = function(scope) {
      if (scope.ok) {
        renderPage(scope);
      }
    
      lib.unlockDatabase(scope);
    };

    lib.lockDatabase(scope);

    if (process.env.REQUEST_METHOD == "POST") {
        handlePost(scope, finish);
    } else if (qs.token) {
        handleToken(scope, finish);
    } else {
      finish(scope);
    }
};

main();
