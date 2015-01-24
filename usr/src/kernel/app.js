var express = require('express');
var session = require('cookie-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var storage = require('node-persist');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var oauthServer = require('oauth2-server');

var routes = require('./routes/index');
var core = require('./utils/core');
var auth = require('./utils/auth');
var authModel = require('./models/auth/fs');

var app = express();

/*
 * Initialize environment
 */

app.set('port', process.env.PORT || 3000);
app.set('uri', process.env.URI || ('http://localhost:' + app.get('port')));
app.set('password', process.env.PASSWORD || 'password');
app.set('cookie secret', process.env.COOKIE_SECRET || 'unsafe');
app.set('root', process.env.ROOT || path.resolve(__dirname, '../../..') );
app.set('root uid', process.env.ROOT_UID || '1');
app.set('root secret', process.env.ROOT_SECRET || 'password');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('storage', storage);
app.set('system path', process.env.SYSTEM_PATH || '/sbin/');
app.set('swap', process.env.SWAP || (path.resolve(app.get('root'), 'var/run/kernel')));
app.set('passwd', process.env.PASSWD || (path.resolve(app.get('root'), 'etc/passwd.json')));
app.set('trust proxy', 1) // trust first proxy, cookie-session

switch(app.get('env')) {
  case 'production':
    app.set('production', true);
    break;

  default:
    app.set('production', false);
    break;
}

var sbin = app.get('system path');

/*
 * Install base middleware.
 */

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: app.get('cookie secret'),
  signed: true
}));

/*
 * Prepare utilities.
 */

// simple fs-based data layer
storage.initSync({ dir: app.get('swap') });

// helpers and middleware
app.auth = auth(app);
app.core = core(app);

// oauth server implementation
app.oauth = oauthServer({
  model: authModel(app),
  grants: ['password', 'authorization_code', 'refresh_token'],
  clientIdRegex: /^\d+$/i, // uids are treated as client IDs
  debug: true
});

/*
 * Handle oauth authentication requests.
 */

app.all(sbin + 'token', app.oauth.grant());

/*
 * Prompt for credentials and redirect to shell (login and logout are identical).
 */

app.get(RegExp(sbin + 'login' + '|' + sbin + 'logout'), 
  app.auth.logout(),
  app.auth.authorise(),
  app.oauth.authorise(),
  app.core.passwd(),
  function(req, res, next) {
    res.redirect(req.user.passwd.shell);
  }
);

/*
 * Allow third-party authorization (i.e., "sudo").
 */

app.get(sbin + 'auth',
  app.auth.authorise(),
  app.oauth.authorise(),
  function (req, res, next) {
    app.oauth.model.getClient(req.query.client_id, null, function(err, client) {
      var fail = function(err) {
        return res.render('error', { 'error': err });
      }
      
      if (err || !client) {
        return fail("invalid client");
      }
  
      res.render('auth', {
        'auth': req.session.user,
        'client': client, 
        'redirect_uri': req.query.redirect_uri
      });
    });
  }
);

/*
 * Complete authorization process.
 */

app.post(sbin + 'auth',
  app.auth.authorise(),
  app.oauth.authorise(),
  app.oauth.authCodeGrant(function (req, next) {
    next(null, req.body.allow === 'yes', req.session.user);
  })
);

/*
 * CGI access to the server.
 */

app.all(RegExp("^(?!" + sbin + ")"),
  app.auth.authorise(),
  app.oauth.authorise(),
  app.core.passwd(),
  app.core.spawn(true));

/*
 * Testing views only visible during debugging
 */

if (!app.get('production')) {
  app.get(sbin + 'dump',
    app.auth.authorise(), 
    app.oauth.authorise(),
    app.core.passwd(),
    
    function(req, res) {
      res.send({ 'user': req.user, 'session': req.session });
    }
  );
}

/*
 * Error handling.
 */

// these only affect error rendering if auth error encountered
app.use(app.auth.rejectInteractive(/oauth/i),
        app.oauth.errorHandler()
);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: app.get('production') ? {} : err
    });
});

/*
 * Take a bow.
 */

module.exports = app;
