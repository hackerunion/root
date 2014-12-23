/*
var http = require('http');
var path = require('path');
var cgi = require('cgi');

var script = path.resolve(__dirname, 'root/hello.cgi');

http.createServer( cgi(script) ).listen(3000);
*/

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
var authModel = require('./models/auth/fs');
var auth = require('./middleware/auth');
var authUtils = require('./utils/auth');

var app = express();

// environment setup
app.set('port', process.env.PORT || 3000);
app.set('uri', ('http://localhost:' + app.get('port')) || process.env.URI);
app.set('password', process.env.PASSWORD || 'password');
app.set('secret key', process.env.SECRET_KEY || 'password');
app.set('cookie key', process.env.COOKIE_KEY || 'unsafe');
app.set('root', process.env.ROOT || path.resolve(__dirname, '../../..') );
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('storage', storage);
app.set('system path', '/sbin/');
app.set('swap', process.env.SWAP || (path.resolve(app.get('root'), 'var/run/kernel')));
app.set('passwd', process.env.PASSWD || (path.resolve(app.get('root'), 'etc/passwd.json')));
app.set('trust proxy', 1) // trust first proxy, cookie-session

switch(app.get('env')) {
  case 'production':
    app.set('production', true);
    break;

  default:
    break;
}

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: app.get('cookie key'),
  signed: true
}));

// initialize storage
storage.initSync({ dir: app.get('swap') });

// oauth server
app.oauth = oauthServer({
  model: authModel(app),
  grants: ['password', 'authorization_code', 'refresh_token'],
  clientIdRegex: /^\d+$/i, /* uids are treated as client IDs */
  debug: true
});

// system calls
var sbin = app.get('system path');

// process oauth access tokens (promote from session, if logged in?)
app.all(sbin + 'token', app.oauth.grant());

// display contents of session
if (!app.get('production')) {
  app.get(sbin + 'secret', app.oauth.authorise(), function (req, res) {
    res.send('Secret area');
  });

  app.get(sbin + 'session', authUtils.injectBearerToken, app.oauth.authorise(), function(req, res) {
    res.send({ 'session': req.session });
  });
}

// login user
app.get(sbin + 'login', auth(app), function(req, res, next) {
  // special case: user is still stored in session
  var shell = req.session.user.passwd.shell;
  
  if (req.body.redirect) {
    return res.redirect(req.body.redirect + '?client_id=' +
      req.body.client_id + '&redirect_uri=' + req.body.redirect_uri);
  }

  res.redirect(shell);
});

// show them the "do you authorise xyz app to access your content?" page
app.get(sbin + 'auth', function (req, res, next) {
  // special case: user is still stored in session
  if (!req.session.user) {
    // If they aren't logged in, send them to your own login implementation
    return res.redirect('/login?redirect=' + req.path + '&client_id=' +
        req.query.client_id + '&redirect_uri=' + req.query.redirect_uri);
  }
  
  app.oauth.model.getClient(req.query.client_id, null, function(err, client) {
    var fail = function(err) {
      return res.render('error', { 'error': err });
    }
    
    if (err || !client) {
      return fail("invalid client");
    }

    res.render('auth', {
      'user': req.session.user,
      'client': client, 
      'redirect_uri': req.query.redirect_uri
    });
  });
});

// handle authorise
app.post(sbin + 'auth', function (req, res, next) {
  // special case: user is still stored in session
  if (!req.session.user) {
    return res.redirect('/login?client_id=' + req.query.client_id +
      '&redirect_uri=' + req.query.redirect_uri);
  }

  next();
}, app.oauth.authCodeGrant(function (req, next) {
  // special case: user is still stored in session
  next(null, req.body.allow === 'yes', req.session.user);
}));

app.post(sbin + 'password', app.oauth.grant());

app.get('/', app.oauth.authorise(), function (req, res) {
  res.send({ 'user': req.user });
});

app.use(app.oauth.errorHandler());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
