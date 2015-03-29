var qs = require('querystring');

module.exports = {
  'parse': function (stream, cb, max) {
    var body = '';
    var max = max || 1e6; // 1mb limit

    stream.on('data', function (data) {
        body += data;

        // Too much POST data, abort
        if (body.length >= max) {
          stream.pause();
          cb('Too much data');
        }
    });

    stream.on('end', function () {
        var post = qs.parse(body);
        cb(null, post);
    });

    stream.on('error', function(err) {
      return cb('Error: ' + err);
    });
  }
};
