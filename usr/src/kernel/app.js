/*
var http = require('http');
var path = require('path');
var cgi = require('cgi');

var script = path.resolve(__dirname, 'root/hello.cgi');

http.createServer( cgi(script) ).listen(3000);
*/

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var storage = require('node-persist');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var oauthServer = require('oauth2-server');
var basicAuth = require('basic-auth');

var routes = require('./routes/index');
var auth_model = require('./models/auth/fs');
var auth = require('./middleware/auth');

var app = express();

// environment setup
app.set('port', process.env.PORT || 3000);
app.set('key', process.env.PASSWORD || 'key');
app.set('root', process.env.ROOT || path.resolve(__dirname, '../../..') );
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('storage', storage);
app.set('system path', '/sbin/');
app.set('memory', process.env.MEMORY || (path.resolve(app.get('root'), 'var/run/kernel')));
app.set('passwd', process.env.PASSWD || (path.resolve(app.get('root'), 'etc/passwd.json')));

switch(app.get('env')) {
  case 'production':
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

// initialize storage
storage.initSync({ dir: app.get('memory') });

// oauth server
app.oauth = oauthServer({
  model: auth_model(app),
  grants: ['password', 'authorization_code', 'refresh_token'],
  debug: true
});

// system calls
var sbin = app.get('system path');

app.get(sbin + 'login', auth, function (req, res) {
  res.send(200, 'Authenticated');
});

app.all(sbin + 'code', app.oauth.authCodeGrant());
app.all(sbin + 'token', app.oauth.grant());
app.post(sbin + 'password', app.oauth.grant());

app.get('/', app.oauth.authorise(), function (req, res) {
  res.send('Secret area');
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
