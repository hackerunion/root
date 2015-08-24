#!/usr/bin/env node

var tiny = require('./lib/tiny');

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var app = tiny.cgi({
  'path': __dirname.replace('/srv', ''),
  'debug': true
});

app.get(/main/, function(req) {
  return tiny.template('templates/chapter/home.jade');
});

app.get(/apply/, function(req) {
  return tiny.template('templates/account/apply.jade');
});

app.get(/home|(?:)/, function(req) {
  return tiny.template('templates/home.jade');
});

tiny.serve(app);
