var basicAuth = require('basic-auth');
var request = require('request');
var _ = require('lodash');

module.exports = function(app) {
  var self = {};

  self.init = function() {
    return self;
  };

  self._reject = function(req, res, nuke) {
    if (nuke) {
      req.basic = false;
      req.user = null;
      req.session.user = null;
    }
    
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    
    return res.sendStatus(401);
  };

  self.hideBasicHeader = function() {
    return function(req, res, next) {
      req.get = function(header) {
        if (header.toLowerCase() == 'authorization') {
          return undefined;
        }
    
        return req.get(header);
      };
    
      next();
    };
  };

  self.oauthify = function() {
    return function(req, res, next) {
      var user = req.session.user;
      var getToken =  req.query.access_token;
      var postToken = req.body ? req.body.access_token : undefined;
  
      req.get = function(header) {
        if (header.toLowerCase() == 'authorization') {
          // always defer to explicit http tokens (basic-auth credentials are secondary to explicit tokens)
          // goes against spec ever so slightly
          if (!user || !user.oauth || getToken !== undefined || postToken !== undefined) {
            return undefined;
          }
  
          return "Bearer " + user.oauth.access_token; 
        }
    
        return req.get(header);
      };
    
      next();
    };
  };

  self.logout = function(force) {
    return function(req, res, next) {
      // only force logout if there is a user logged in (or requested)
      if (force || req.user || req.session.user) {
        return self._reject(req, res, true);
      }
      
      // otherwise, we're already logged out
      return next();
    };
  };
  
  self.guard = function(basic) {
    return function(req, res, next) {
      if ((req.session.user || req.user) && (!basic || req.basic)) {
        return next();
      }

      self._reject(req, res);
    };
  };
  
  // TODO: this forces oauth clients to add "api" flag to all requests... probably should fix this
  self.rejectInteractive = function(filter) {
    return function(err, req, res, next) {
      if (!err || req.query.api || (filter && !filter.test(err.name))) {
        return next(err);
      }
      
      self._reject(req, res);
    }
  };

  self.basic = function() {
    var oauthPasswordRequest = function(req, res, username, password, next) {
      request.post(app.get('uri') + app.get('system path') + 'token', { 
        json: true, 
        form: {
          grant_type: 'password',
          username: username,
          password: password,
          client_id: app.get('root uid'),
          client_secret: app.get('root secret')
        },
      }, function (err, res, body) {
        if (err || res.statusCode != 200 || !('access_token' in body)) {
          return next(true);
        }
        
        app.core.readPasswdForUser(username, function(err, passwd) {
          if (err || !passwd) {
            return next(true);
          }
          
          // this defines the session-user object which contains all user fields plus a token
          next(false, {
            id: passwd.uid,
            passwd: passwd,
            oauth: body
          });
        });
      });
    };
  
    return function (req, res, next) {
      var creds = basicAuth(req);
      req.basic = false;      

      // if creds missing, prompt for auth
      if (!creds || !creds.name || !creds.pass) {
        return next();
      }
  
      return oauthPasswordRequest(req, res, creds.name, creds.pass, function(err, user) {
        if (err || !user) {
          return next();
        }
  
        // add authentication information to session
        req.basic = true;
        req.session.user = user;

        return next();
      });
    };
  };

  self.authorise = function() {
    // attempt basic auth + oauthification in one shot
    return function(req, res, next) {
      self.basic()(req, res, function() {
        self.oauthify()(req, res, next);
      });
    };
  };
  
  return self.init();
};
