#!/usr/bin/env node

var jade = require('jade');
var querystring = require('querystring');

var _ = require('/srv/lib/js/lodash');
var body = require('/srv/lib/js/body');

console.log("Status: 200");
console.log("Content-Type: text/html");
console.log("");

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

try {
var fn = jade.compileFile('templates/index.jade');
} catch(e) {
  return console.log("<pre>"+e+"</pre>");
}
console.log(fn({
  'path': __dirname.replace('/srv', '')
}));
