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

var urlToPathname = function(u) {
  return path.join('/srv', url.parse(u).pathname);
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

if (process.env.REQUEST_METHOD == "POST") {
  return handlePostAPI();
}

try {
  var fn = jade.compileFile('templates/index.jade');
} catch(e) {
  error(e);
}

var qs = querystring.parse(process.env.QUERY_STRING);
var stack;

if (qs.load) {
  try {
    stack = fs.readFileSync(urlToPathname(qs.load));
  } catch (e) { 
    console.log("Status: 404");
    console.log("Content-type: text/plain");
    console.log("");
    console.log("404: \"" + qs.load + "\" was not found.");
    return;
  }
}

console.log("Status: 200");
console.log("Content-Type: text/html");
console.log("");

console.log(fn({
  'path': __dirname.replace('/srv', ''),
  'timestamp': getTimestamp(),
  'stack': stack,
  'url': qs.load
}));
