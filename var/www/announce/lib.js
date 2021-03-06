// ensure that all paths are relative to this file's actual location

var fs = require('fs');
var crypto = require('crypto');

var _ = require('/srv/lib/js/lodash');
var lockFile = require('/srv/lib/js/lockfile');

var lib = {
    //
    // Constants
    //
    
    'dbPath': '/srv/srv/announce/database.json',
    'lockPath': '/srv/var/lock/announce.lock',
    'appBaseURI': '/var/www/announce',
    'coolDown': 300,
    'ttl': 3,

    //
    // Utility
    //
    
    'confidence': function(pos, neg) {
      var n = pos + neg;
      var z = 1.6;
      var phat;
    
      if (!n) {
        return 0;
      }
      
      phat = pos / n;
    
      return Math.sqrt(phat+z*z/(2*n)-z*((phat*(1-phat)+z*z/(4*n))/n))/(1+z*z/n);
    },
  
    'getTimestamp': function() {
      return (new Date()).toISOString();
    },

    'getScore': function(profile) {
      return lib.confidence(profile.reputation.good, profile.reputation.bad);
    },
    
    'getGrade': function(score) {
      var grades = ['F', 'D', 'C', 'B', 'A'];
      return grades[Math.round((grades.length - 1) * score)];
    },
    
    'getReachByScore': function(score) {
      switch(lib.getGrade(score)) {
        case 'A':
          return 0.75;

        case 'B':
          return 0.45;

        case 'C':
          return 0.20;

        case 'D':
          return 0.10;

        case 'F':
          return 0.05;
      }
    },

    'chooseByScore': function(score, inc, exc) {
      var args = exc.slice() || [];

      args.unshift(inc);
      inc = _.without.apply(_, args);
      
      return _.sample(inc, Math.round(inc.length * lib.getReachByScore(score)));
    },

    'getTopics': function(topics) {
      if (!topics.trim() || /[^\s\w#,]/.test(topics) || topics.length > 2000) {
        return null;
      }
    
      return _.filter(topics.toLowerCase().replace(/#/g, '').split(/[\s,]+/));
    },
    
    'getToken': function() {
      return Math.random().toString(36).replace(/^.|\W/g, '');
    },

    'hashToken': function(token) {
      return crypto.createHash('sha1').update(token).digest('hex');
    },

    'getScope': function(db, user) {
      return {
        'db': db,
        'user': user,
        'ok': true,
        'msg': '',
        'dirty': false,
        'compose': {}
      };
    },
    
    'secondsElapsed': function(d1, d2) {
        return (Math.max(d1, d2) - Math.min(d1, d2)) / 1000;
    },

    //
    // Model
    //

    'lockDatabase': function(scope) {
      try {
        lockFile.lockSync(lib.lockPath);
      } catch (e) {
        return false;
      }
    },
    
    'unlockDatabase': function(scope) {
      if (scope.dirty) {
        try {
          fs.writeFileSync(lib.dbPath, JSON.stringify(scope.db, null, 2));
        } catch (e) {
          return false;
        }
      }
    
      lockFile.unlockSync(lib.lockPath);
    },
    
    'setProfile': function(scope, user, profile) {
      scope.db.users[user] = profile;
      scope.dirty = true;
    },
    
    'getProfile': function(scope, user) {
	    if (!(user in scope.db.users)) {
	        scope.db.users[user] = {};
	    }

        return _.defaults(scope.db.users[user], {
            "reputation": {
                "good": 0,
                "bad": 0,
                "total": 0,
                "score": 0
            },
            "topics": ["general"]
        });
    },

    'getAnnounceMap': function(scope) {
      return _.mapValues(_.groupBy(scope.db.announcements, 'id'), _.first);
    },

    'getAnnounce': function(scope, id) {
      return lib.getAnnounceMap(scope)[id];
    },

    'lastAnnounce': function(scope, user) {
        return _.max(_.filter(scope.db.announcements, 'user', user), function(a) {
            return Date.parse(a.timestamp);
        });
    },
    
    'setAnnounce': function(scope, user, topics, subject, message) {
      var id = scope.db.announcements.length;
      var announce = scope.db.announcements[id] = {
        'id': id,
        'topics': topics,
        'subject': subject,
        'text': message,
        'timestamp': lib.getTimestamp(),
        'user': user
      };
    
      scope.dirty = true;
    
      return announce;
    },
    
    'queueAnnounce': function(scope, announce, score) {
      scope.db.spool.push({
        'id': announce.id,
        'ttl': lib.ttl,
        'timestamp': null,
        'score': score || 0,
        'users': [announce.user]
      });
    
      scope.dirty = true;
    },

    'processQueue': function(scope, cb) {
      var map = lib.getAnnounceMap(scope);
      
      scope.dirty = true;

      scope.db.spool.forEach(function (task, i) {
        if (!task.ttl) {
          scope.db.spool.splice(i, 1);
          return;
        }
        cb(task, map[task.id]);
      });
    },

    'targetUsers': function(scope, users, topics) {
      return _.filter(users, function(user) {
        var profile = lib.getProfile(scope, user);
        return !profile.topics || "general" in profile.topics || _.intersection(profile.topics, topics);
      });
    },
    
    'popToken': function(scope, token) {
        var hashed = lib.hashToken(token);
        var result = scope.db.tokens[hashed];
        
        delete scope.db.tokens[hashed];
        scope.dirty = true;
    
        return result;
    },
    
    'setToken': function(scope, user, action, token) {
        var token = token || lib.getToken();
        var hashed = lib.hashToken(token);

        scope.db.tokens[hashed] = { 'user': user, 'action': action };
        scope.dirty = true;
    
        return token;
    }
};

module.exports = lib;
