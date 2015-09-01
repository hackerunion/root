#!/usr/bin/env node

var _ = require('/srv/lib/js/lodash');

var tiny = require('./lib/tiny');
var config = {
  'defaultChapter': 'nyc'
};

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var app = tiny.cgi({
  'path': __dirname.replace('/srv', ''),
  'debug': true
});

var context = function(req, obj) {
  return _.assign({
    'chapter': req.params && req.params.length > 1 ? req.params[1] : config.defaultChapter,
    'user': process.env.USER || 'guest',
    'guest': process.env.USER == 'guest'
  }, obj);
};

app.get(/([a-z]{3})\/login/i, function(req) {
  return tiny.template('templates/login.jade', context(req));
});

app.get(/([a-z]{3})\/join/i, function(req) {
  return tiny.template('templates/join.jade', context(req));
});

app.get(/([a-z]{3})\/recover/i, function(req) {
  return tiny.template('templates/recover.jade', context(req));
});

app.get(/([a-z]{3})\/account/i, function(req) {
  return tiny.template('templates/account.jade', context(req));
});

app.get(/([a-z]{3})\/start/i, function(req) {
  return tiny.template('templates/start.jade', context(req));
});

app.get(/([a-z]{3})\/about/i, function(req) {
  return tiny.template('templates/about.jade', context(req));
});

app.get(/([a-z]{3})\/hack/i, function(req) {
  return tiny.template('templates/hack.jade', context(req));
});

app.get(/([a-z]{3})\/host/i, function(req) {
  return tiny.template('templates/host.jade', context(req));
});

app.get(/([a-z]{3})\/stuff/i, function(req) {
  return tiny.template('templates/stuff.jade', context(req));
});

app.get(/([a-z]{3})\/index/i, function(req) {
  return tiny.template('templates/index.jade', context(req));
});

app.get(/index|(?:)/i, function(req) {
  return tiny.redirect('/' + config.defaultChapter + '/index');
});

tiny.serve(app);
