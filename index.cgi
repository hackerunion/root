#!/usr/bin/env node

var qs = process.env.QUERY_STRING;

console.log("Status: 302");
console.log("Location: " + process.env.HOME.replace("/srv", "") + (qs ? "?" + qs : ""));

// A blank line ends the headers.
console.log("");
