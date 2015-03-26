#!/bin/bash

source "$SERVER_ROOT/usr/lib/bash/cgi/getvar.bash"
source "$SERVER_ROOT/usr/lib/bash/json/escape.bash"

cgi_getvars GET path

DATA="[]"
STATUS=500

if [ -d "$path" -a -x "$path" ]; then
  DATA="["
  
  for ITEM in `ls -aLF "$path" 2> /dev/null`; do
    TYPE="-"

    if echo "$ITEM" | grep -q '[\/\*@=%\|]$'; then
      TYPE="${ITEM:${#ITEM}-1}"
      ITEM="${ITEM::${#ITEM}-1}"
    fi

    DATA="$DATA { \"path\": `json_escape "$ITEM"`, \"type\": \"$TYPE\" },"
  done
  
  DATA=$(echo "$DATA" | sed -e 's/,\?$/ ]/')
  STATUS=200
fi

echo "Content-type: application/json"
echo "Status: $STATUS"
echo ""
echo "{ \"path\": \"$path\", \"value\": " $DATA " }"
