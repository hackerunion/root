#!/bin/bash

source "$SERVER_ROOT/usr/lib/bash/cgi/getvar.bash"
source "$SERVER_ROOT/usr/lib/bash/json/escape.bash"

cgi_getvars GET path

FILE=""
STATUS=200;

if [ -r "$path" ]; then
  FILE="$(cat "$path" 2> /dev/null)"
else
  STATUS=500
fi

echo "Content-type: text/html"
echo "Status: $STATUS"
echo ""
cat <<EOF
<form action=".">
  <p>
    <label>Your name:<br /><input type="text" /></label>
  </p>

  <p>
    <label>Your email:<br /><input type="text" /></label>
  </p>
  
  <p>
    <label>Desired username:<br /><input type="text" /></label>
  </p>

  <p>
    <input type="submit" />
  </p>
</form>
EOF
