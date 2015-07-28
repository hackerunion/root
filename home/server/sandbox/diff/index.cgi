#!/usr/bin/env node

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var fs = require('fs');
var url = require('url');
var path = require('path');
var jade = require('jade');
var querystring = require('querystring');

var _ = require('/srv/lib/js/lodash');
var body = require('/srv/lib/js/body');

var error = function(e) {
  console.log("Status: 200");
  console.log("Content-Type: text/html");
  console.log("");
  console.log("<pre>"+e+"</pre>");
  process.exit(0);
};

var getTimestamp = function() {
  return (new Date()).getTime();
};

var humanizeTimestamp = function(ts) {
  return (new Date(ts)).toISOString();
};

var urlToPathname = function(u) {
  return path.join('/srv', url.parse(u).pathname);
};

var readWithMetadata = function(pathname, timestamp) {
    var obj = { 'timestamp': null, 'conflict': false, 'pathname': pathname, 'data': null, 'exists': false };
    var stat;

    try {
      stat = fs.statSync(pathname);
      obj.timestamp = stat.mtime.getTime();
      obj.conflict = timestamp && stat.mtime.getTime() >= timestamp;

    } catch (e) { obj.error = e.message;};
    
    try {
      var data = fs.readFileSync(pathname);

      // special support for json
      try {
        obj.data = JSON.stringify(JSON.parse(data), null, 2);
      } catch(e) {
        obj.data = data; 
      }

      obj.exists = true;

    } catch(e) { obj.error = e.message; };

    return obj;
};

var handlePostAPI = function() {
  body.parse(process.stdin, function(err, qs) {
    var timestamp = getTimestamp();
    var extra = {};
    
    try {
      if (err || !qs || !(qs.url && qs.timestamp && qs.stack)) {
        throw new Error("An unexpected error has occurred.");
      }

      var pathname = urlToPathname(qs.url);
      var stat;

      try {
        stat = fs.statSync(pathname);
      } catch (e) { /* nop */ };
      
      if (stat && stat.mtime.getTime() >= parseInt(qs.timestamp)) {
        throw new Error("The file was modified by someone else.");
      }

      fs.writeFileSync(pathname, qs.stack);

    } catch (e) {
      console.log("Status: 200");
      console.log("Content-Type: application/json");
      console.log("");
      console.log(JSON.stringify({ 
        'error': e.message
      })); 

      return;
    }

    console.log("Status: 200");
    console.log("Content-Type: application/json");
    console.log("");
    
    console.log(JSON.stringify({ 
      'timestamp': timestamp,
      'extra': extra
    })); 
  }, 1e7);
};

var handleGet = function() {
  var qs = querystring.parse(process.env.QUERY_STRING);
  var pathname = qs.url ? urlToPathname(qs.url) : qs.path;
  var timestamp = qs.timestamp ? parseInt(qs.timestamp) : null;
  var file = readWithMetadata(pathname, timestamp);

  respond(file, qs.data, timestamp || getTimestamp(), pathname ? null : "You must specify a path or a URL");
};

var respond = function(file, modified, timestamp, msg) {
  try {
    var fn = jade.compileFile('templates/index.jade');
  } catch(e) {
    error(e);
  }
  
  console.log("Status: 200");
  console.log("Content-Type: text/html");
  console.log("");
  
  console.log(fn({
    'path': __dirname.replace('/srv', ''),
    'modified': modified,
    'original': file.data,
    'pathname': file.pathname,
    'timestamp': timestamp,
    'humanize': humanizeTimestamp(timestamp),
    'message': msg || file.error
  }));
}

if (process.env.REQUEST_METHOD == "POST") {
  handlePost();
} else {
  handleGet();
}

