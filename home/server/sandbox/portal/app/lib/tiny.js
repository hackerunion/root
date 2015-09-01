var fs = require('fs');
var path = require('path');
var jade = require('jade');
var querystring = require('querystring');

var _ = require('/srv/lib/js/lodash');
var body = require('/srv/lib/js/body');
var lockFile = require('/srv/lib/js/lockfile');

tiny = {
  db: function(p) {
    var obj = {
      'data': {},

      'read': function() {
        try {
          obj.data = require(p);
          return true;
        } catch(e) {
          obj.data = {};
          return false;
        }
      },

      'write': function() {
        try {
          fs.writeFileSync(p, JSON.stringify(obj.data, null, 2));
          return true;
        } catch(e) {
          return false;
        }
      },

      'open': function() {
        var r1 = obj.lock();
        var r2 = obj.read();
        return r1 && r2;
      },

      'close': function() {
        var r1 = obj.write();
        var r2 = obj.unlock();
        return r1 && r2;
      },

      'lock': function() {
        try {
          lockFile.lockSync(p + '.lock');
        } catch(e) {
          return false;
        }
      },
      
      'unlock': function() {
        try {
          lockFile.unlockSync(p + '.lock');
        } catch(e) {
          return false;
        }
      }
    };
      
    return obj;
  },

  out: function(t) {
    console.log(t);
  },

  error: function(msg, http) {
    var err = Error(msg);
    err.http = http;
    throw err;
  },

  headers: function(code, mime, extra) {
    tiny.out("Status: " + code);
    tiny.out("Content-Type: " + ( mime || "text/html"));

    for (header in extra) {
      tiny.out(header + ': ' + extra[header]);
    }    

    tiny.out("");
  },

  fail: function(exc) {
    var exc = exc || {};

    exc.http = exc.http || 500;
    exc.message = exc.message || 'Internal Server Error';

    tiny.headers(exc.http);
    tiny.out("<h1>Error " + exc.http + "</h1><hr /><pre>" + exc.message + "</pre>");
  },

  markup: function(markup, code, mime) {
    var code = code || 200;
    var mime = mime || 'text/html';

    return function(app) {
      return {
        'code': code,
        'mime': mime,
        'body': markup
      };
    };
  },

  template: function(name, ctx, code, mime) {
    var fn = jade.compileFile(name);
    var ctx = ctx || {};
    var code = code || 200;
    var mime = mime || 'text/html';

    return function(app) {
      ctx = _.clone(ctx);
      ctx.path = app['_cfg'].path || '';
      ctx.globals = app['_cfg'].globals;
      ctx.link = ctx.path + '?path=';

      return {
        'code': code,
        'mime': mime,
        'body': fn(ctx)
      };
    };
  },

  file: function(pathname, code, mime) {
    var code = code || 200;
    var mime = mime || 'text/html';

    return function(app) {
      return {
        'code': code,
        'mime': mime,
        'body': fs.readFileSync(path.join(app['_cfg'].path || '', pathname), 'utf-8')
      };
    };
  },

  redirect: function(link) {
    return function(app) {
      return {
        'code': 302,
        'mime': 'text/plain',
        'headers': { 'Location': (app['_cfg'].path || '') + '?path=' + link },
        'body': ''
      };
    };
  },

  cgi: function(cfg) {
    var obj = { '_get': [], '_post': [], '_cfg': cfg};

    obj.get = function(path, cb) {
      obj['_get'].push([path, cb]);
    };

    obj.post = function(path, cb) {
      obj['_post'].push([path, cb]);
    };
    
    return obj;
  },

  serve: function(app) {
    var key;
    var qs = querystring.parse(process.env.QUERY_STRING);

    body.parse(process.stdin, function(err, post) {
      try {
        if (err) {
          throw Error('Invalid request');
        }
  
        switch(process.env.REQUEST_METHOD) {
          case 'POST':
            key = '_post';
            break;
      
          case 'GET':
            key = '_get';
            break;
      
          default:
            throw Error('Unsupported method');
            break;
        }
        
        var path = (qs.path || '').replace(/^\/|\/$/g, '');
        var handle = _.find(app[key], function(pair) {
          return (pair[0] || (new RegExp(''))).test(path);
        });
    
        if (!handle) {
          throw Error('Unknown path');
        }
  
        var req = {
          'get': qs,
          'post': post,
          'params': path.match(handle[0])
        };
  
        var res = handle[1](req)(app);
  
        tiny.headers(res.code, res.mime, res.headers);
        tiny.out(res.body);
  
        if (app['_cfg'].debug) {
          tiny.out('<hr />Request: <pre>' + JSON.stringify(req) + '</pre><br />Response: <pre>' + JSON.stringify(res).replace(/[<>]/g, '\n') + '</pre>');
        }
      } catch(e) {
        tiny.fail(e);
      }
    }, 1e7); 
  }
};

module.exports = tiny;
