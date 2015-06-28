#!/usr/bin/env node

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var _ = require('/srv/lib/js/lodash');
var jade = require('jade');
var querystring = require('querystring');
var body = require('/srv/lib/js/body');

var lib = require('./lib')

var qs = querystring.parse(process.env.QUERY_STRING);
var user = process.env.USER;

var ttl = 3;

//
// Utility
//

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

var getScore = function(profile) {
  return confidence(profile.reputation.good, profile.reputation.bad);
};

var getGrade = function(score) {
  var grades = ['F', 'D', 'C', 'B', 'A'];
  return grades[Math.round((grades.length - 1) * score)];
};

var getTopics = function(topics) {
  if (!topics.trim() || /[^\s\w#,]/.test(topics) || topics.length > 2000) {
    return null;
  }

  return _.filter(topics.toLowerCase().replace(/#/g, '').split(/[\s,]+/));
}

var getToken = function() {
  return Math.random().toString(36).replace(/^.|\W/g, '');
};

//
// Model
//

var lockDatabase = function(scope) {
  try {
    lockFile.lockSync(lockPath);
  } catch (e) {
    console.log("Status: 500\n");
    return false;
  }
};

var unlockDatabase = function(scope) {
  if (scope.dirty) {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(scope.db, null, 2));
    } catch (e) {
      console.log("Status: 500\n");
      return false;
    }
  }

  lockFile.unlockSync(lockPath);
};

var setProfile = function(scope, user, profile) {
  scope.db.users[user] = profile;
  scope.dirty = true;
};

var getProfile = function(scope, user) {
    return _.defaults(scope.db.users[user] || {}, {
        "reputation": {
            "good": 0,
            "bad": 0,
            "ignore": 0,
            "score": 0
        },
        "topics": ["#general"]
    });
};

var setAnnounce = function(scope, user, topics, message) {
  var id = scope.db.announcements.length;
  var announce = scope.db.announcements[id] = {
    'id': id,
    'topics': topics,
    'text': message,
    'timestamp': (new Date()).toISOString(),
    'user': user
  };

  scope.dirty = true;

  return announce;
};

var queueAnnounce = function(scope, announce, score) {
  scope.db.spool.push({
    'id': announce.id,
    'ttl': ttl,
    'timestamp': null,
    'score': score || 0,
    'users': []
  });

  scope.dirty = true;
};

var popToken = function(scope, token) {
    var result = scope.db.tokens[token];
    
    delete scope.db.tokens[token];
    scope.dirty = true;

    return result;
};

var setToken = function(scope, user, action, token) {
    var token = getToken();

    scope.db.tokens[token] = { 'user': user, 'action': action };
    scope.dirty = true;

    return token;
};

// Controller

var handleVote = function(scope, user, good, cb) {
  var profile = getProfile(scope, user);

  profile.reputation.good += (good && 1);
  profile.reputation.bad += (good || 1);
  profile.reputation.score = getScore(profile);

  scope.msg = (good ? "Upvote" : "Downvote") + " saved!";

  cb(scope);
};

var handleSaveTopics = function(scope, qs, cb) {
  var profile = getProfile(scope, user);

  profile.topics = getTopics(qs.topics);
  
  if (profile.topics === null) {
    scope.msg = "Invalid topics.";
    return cb(scope);
  }

  setProfile(scope, profile);

  scope.msg = "Topics saved.";
  cb(scope);
};

var handleAnnounce = function(scope, qs, cb) {
  var topics = getTopics(qs.topics);
  var profile = getProfile(scope, user);
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

  // TODO: ensure user isn't spamming...
  var announce = setAnnounce(scope, user, topics, message);
  queueAnnounce(scope, announce, profile.reputation.score);

  scope.msg = "Message sent!";

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
    var token = popToken(scope, qs.token);

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

    profile = getProfile(scope, user);
    
    var total = 100;
    var score = profile.reputation.score;
    var grade = getGrade(score); 
    
    console.log(fn({
      'path': '/home/server/sandbox/announce',
      'message': scope.msg,
      'compose': scope.compose,
      'user': user,
      'total': total,
      'profile': profile,
      'topics': _.map(profile.topics, function(s) { return "#" + s; }).join("\n"),
      'grade': grade,
      'score': score,
      'authorized': user != 'guest',
    }));
};

var main = function() {
    var scope = {
      'db': require(lib.dbPath),
      'ok': true,
      'msg': '',
      'dirty': false,
      'compose': {}
    };
    
    if (user == "guest") {
      return renderPage(scope);
    }

    var finish = function(scope) {
      if (scope.ok) {
        renderPage(scope);
      }
    
      unlockDatabase(scope);
    };

    lockDatabase(scope);

    if (process.env.REQUEST_METHOD == "POST") {
        handlePost(scope, finish);
    } else if (qs.token) {
        handleToken(scope, finish);
    } else {
      finish(scope);
    }
};

main();
