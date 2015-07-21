#!/usr/bin/env node

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var jade = require('jade');
var querystring = require('querystring');

var _ = require('/srv/lib/js/lodash');
var body = require('/srv/lib/js/body');

var handlePostAPI = function() {
  console.log("Status: 200");
  console.log("Content-Type: application/json");
  console.log("");
  console.log(JSON.stringify({ 
    'hello': 'world'
  })); 
};

if (process.env.REQUEST_METHOD == "POST") {
  return handlePostAPI();
}

console.log("Status: 200");
console.log("Content-Type: text/html");
console.log("");

try {
  var fn = jade.compileFile('templates/index.jade');
} catch(e) {
  return console.log("<pre>"+e+"</pre>");
}

console.log(fn({
  'path': __dirname.replace('/srv', '')
}));
