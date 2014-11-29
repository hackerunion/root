var fs = require('fs');
var _ = require('lodash');
var utils = {};
  
utils.readPasswd = function(app, cb) {
  fs.readFile(app.get('passwd'), 'utf8', function (err, data) {
    cb(err, err ? null : JSON.parse(data));
  });
};
  
utils.readPasswdForUser = function(app, username, cb) {
	utils.readPasswd(app, function(err, data) {
		var user = _.find(data || [], { 'username': username });

		if (!user) {
			return cb("User not found");
		}

		cb(null, user);
	});
};

module.exports = utils;
