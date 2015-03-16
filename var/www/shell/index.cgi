#!/usr/bin/env node

var jade = require('jade');
var path = require('path');

console.log("Status: 200");
console.log("Content-Type: text/html");
console.log("");

// ensure that all paths are relative to this file's actual location
process.chdir(__dirname);

var fn = jade.compileFile('templates/index.jade');

console.log(fn({
  'message': 'hello world'
}));
