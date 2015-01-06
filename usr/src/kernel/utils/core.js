var _ = require('lodash');
var fs = require('fs');
var cgi = require('cgi');
var path = require('path');

module.exports = function(app) {
  var self = {};

  self.init = function() {
    return self;
  };

  self.readPasswd = function(cb) {
    fs.readFile(app.get('passwd'), 'utf8', function (err, data) {
      cb(err, err ? null : JSON.parse(data));
    });
  };
    
  self.readPasswdForUser = function(username, cb) {
  	self.readPasswd(function(err, data) {
  		var passwd = _.find(data || [], { 'username': username });
  
  		if (!passwd) {
  			return cb("User not found");
  		}
  
  		cb(null, passwd);
  	});
  };
    
  self.readPasswdForUID = function(uid, cb) {
  	self.readPasswd(function(err, data) {
  		var passwd = _.find(data || [], { 'uid': uid });
  
  		if (!passwd) {
  			return cb("User not found");
  		}
  
  		cb(null, passwd);
  	});
  };
  
  self.passwd = function() {
    return function(req, res, next) {
      if (req.user === undefined || req.user.id === undefined || req.user.passwd) {
        return next();
      }
  
      self.readPasswdForUID(req.user.id, function(err, passwd) {
        if (err || !passwd) {
          return next("User not found");
        }
        
        req.user.passwd = passwd;
        next();
      });
    }
  };

  self.spawn = function(sudo) {
    return function(req, res, next) {
      var script = path.resolve(app.get('root'), path.normalize(req.path).slice(1));
      var options = {
        'cwd': app.get('root')
      };

      if (sudo) {
        options.uid = parseInt(req.user.id);
      }

      console.log("Running...", script);

      var handler = cgi(script, options);
      
      return handler(req, res, next);
    };
  };

  return self.init();
};
