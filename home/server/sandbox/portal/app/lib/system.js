var child_process = require('child_process');

var passwd = require('/srv/etc/passwd.json');
var contact = require('/srv/etc/'

var obj = {};

obj.run = function(bin, args) {
  // This is analgous to exec, but is synchronous and respects setuid/setgid
  child_process.execFileSync('/srv/bin/super', [bin].concat(args));
};

obj.addUser = function(username, pass, email) {
};

obj.getUser = function(username) {
  return { 'username': username, 'email': 'email@example.com' };
};

obj.getUserFromEmail = function(email) {
  return { 'username': username, 'email': 'email@example.com' };
};

obj.setPassword = function(username, pass) {
};

obj.setEmail = function(username, pass) {
};

obj.sendEmail = function(email, subject, body) {
};

module.exports = obj;
