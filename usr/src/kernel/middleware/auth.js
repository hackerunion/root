var basicAuth = require('basic-auth');
var request = require('request');

var core = require('../utils/core');

module.exports = function(app) {
  var oauthPasswordRequest = function(req, res, username, password, next) {
    var root_uid = 1;

    request.post(app.get('uri') + app.get('system path') + 'password', { 
      json: true, 
      form: {
        grant_type: 'password',
        username: username,
        password: password,
        client_id: root_uid,
        client_secret: app.get('secret key')
      },
    }, function (err, res, body) {
      if (err || res.statusCode != 200 || !('access_token' in body)) {
        return next(true);
      }
      
      core.readPasswdForUser(app, username, function(err, passwd) {
        if (err) {
          return next(true);
        }
        
        // this defines the fields available in the user object
        next(false, {
          username: username,
          id: passwd.uid,
          token: body,
          passwd: passwd
        });
      });
    });
  };

   return function (req, res, next) {
    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    };
  
    var user = basicAuth(req);
    
    // if user already logged in or credentials missing, prompt for auth
    if (req.session['user'] || !user || !user.name || !user.pass) {
      // nuke existing session (if any), and prompt for login
      req.session['user'] = null;
      return unauthorized(res);
    };

    return oauthPasswordRequest(req, res, user.name, user.pass, function(err, user) {
      if (err || !user) {
        return unauthorized(res);
      }

      // log user in
      req.session.user = user;
      
      return next();
    });
  };
};
