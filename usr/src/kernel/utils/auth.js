var _ = require('lodash');
var utils = {};
  
utils.hideBasicHeader = function(req, res, next) {
  req.get = function(header) {
    if (header.toLowerCase() == 'authorization') {
      return undefined;
    }

    return req.get(header);
  };

  next();
};

utils.injectBearerToken = function(req, res, next) {
  if (req.query.access_token || req.body.access_token || !req.session.user || !req.session.user.token) {
    return next();
  }

  var token = req.session.user.token;

  req.get = function(header) {
    if (header.toLowerCase() == 'authorization') {
      return "Bearer " + token.access_token; 
    }

    return req.get(header);
  };

  next();
};

module.exports = utils;
