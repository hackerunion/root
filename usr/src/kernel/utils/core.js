var fs = require('fs');
var _ = require('lodash');

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

  return self.init();
};
