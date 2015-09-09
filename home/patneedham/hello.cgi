#!/bin/bash

echo "Content-type: text/html"
echo "Status: 200"
echo
echo "<html>"
echo "<h1>My environment variables:</h1>"
echo "<pre>`env`</pre>"
echo "</html>"
