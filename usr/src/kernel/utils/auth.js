var _ = require('lodash');
var utils = {};
  
utils.hideBasicHeader = function(req, res, next) {
  req.get = function(header) {
    if (header == 'Authorization') {
      return undefined;
    }

    return req.get(header);
  };

  next();
};

module.exports = utils;
