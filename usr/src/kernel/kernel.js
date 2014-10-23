var http = require('http');
var path = require('path');
var cgi = require('cgi');

var script = path.resolve(__dirname, 'root/hello.cgi');

http.createServer( cgi(script) ).listen(3000);
