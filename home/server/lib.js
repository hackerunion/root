var child_process = require('child_process');

var passwd = require('/srv/etc/passwd.json');
var contact = require('/srv/etc/'

var _system = function(bin, args) {
  // This is analgous to exec, but is synchronous and respects setuid/setgid
  child_process.execFileSync('/srv/bin/super', [bin].concat(args));
};

module.exports = {
  'setCurrentPassword': function() {
  },

  'setCurrentEmail': function() {
  },

  'getCurrentUser': function() {
  },

  'createUser': function() {
  },
};
