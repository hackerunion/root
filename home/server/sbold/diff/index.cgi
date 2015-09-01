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

var fuzzyMatch = function(s1, s2) {
  return (s1 || '').toString().replace(/[^\w]/g, '').toLowerCase() == (s2 || '').toString().replace(/[^\w]/g, '').toLowerCase();
};

var readWithMetadata = function(pathname, timestamp, original) {
    var obj = { 'timestamp': null, 'conflict': false, 'pathname': pathname, 'data': null, 'exists': false, 'modified': false, 'errors': [] };
    var stat;

    try {
      stat = fs.statSync(pathname);
      obj.timestamp = stat.mtime.getTime();
      obj.modified = obj.conflict = timestamp && stat.mtime.getTime() > timestamp;

    } catch (e) { obj.error.push(e.message); };
    
    try {
      var data = fs.readFileSync(pathname);
 
      // attempt to compare original with current data
      if (original !== undefined) {
        data.conflict = !fuzzyMatch(original, data);
      }

      // special support for json
      try {
        obj.data = JSON.stringify(JSON.parse(data), null, 2);
      } catch(e) {
        obj.data = data.toString(); 
      }

      obj.exists = true;

    } catch(e) { obj.errors.push(e.message); };

    return obj;
};

var handlePost = function() {
  body.parse(process.stdin, function(err, qs) {
    var file;

    var msg = "File saved!";
    var saved = true;

    try {
      if (err || !qs || !(qs.timestamp && qs.pathname)) {
        throw new Error("An unexpected error has occurred.");
      }
      
      file = readWithMetadata(qs.pathname, parseInt(qs.timestamp), qs.original);
      
      if (file.conflict) {
        throw new Error("File has been modified. Please review and try again.");
      }

      fs.writeFileSync(file.pathname, qs.modified);

    } catch(e) { 
      msg = e.message;
      saved = false;
    }

    respond(file, qs.modified, file && file.modified ? file.timestamp : getTimestamp(), qs.next, msg, saved);
  });
};

var handleGet = function() {
  var qs = querystring.parse(process.env.QUERY_STRING);
  var pathname = qs.url ? urlToPathname(qs.url) : qs.path;
  var timestamp = qs.timestamp ? parseInt(qs.timestamp) : null;
  var file = readWithMetadata(pathname, timestamp);

  respond(file, qs.data, timestamp || getTimestamp(), qs.next, pathname ? null : "You must specify a path or a URL");
};

var respond = function(file, modified, timestamp, next, msg, result) {
  if (result && next) {
    console.log("Status: 303");
    console.log("Location: " + next);
    console.log("");
    return;
  }

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
    'next': next,
    'humanize': humanizeTimestamp(timestamp),
    'message': msg || file.error
  }));
}

if (process.env.REQUEST_METHOD == "POST") {
  handlePost();
} else {
  handleGet();
}

