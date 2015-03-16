#!/bin/bash

DATA="[]"
STATUS=500;

if [ -d "$QUERY_STRING" -a -x "$QUERY_STRING" ]; then
  DATA="["
  
  for ITEM in `ls "$QUERY_STRING" 2> /dev/null`; do
    DATA="$DATA \"${ITEM//\"/\\\"}\","
  done
  
  DATA=$(echo "$DATA" | sed -e 's/,$/ ]/')
  STATUS=200
fi

echo "Content-type: application/json"
echo "Status: $STATUS"
echo ""
echo "{ \"directory\": \"$QUERY_STRING\", \"value\": " $DATA " }"
