#!/usr/bin/env node

console.log("Status: 302");
console.log("Location: " + process.env.HOME.replace('/srv', ''));

// A blank line ends the headers.
console.log("");
