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

echo "Content-type: application/json"
echo "Status: $STATUS"
echo ""
echo "{ \"path\": \"$path\", \"value\": `json_escape "$FILE"` }"
