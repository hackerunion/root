#!/bin/bash

FILE=""
STATUS=200;

if [ -r "$QUERY_STRING" ]; then
  FILE="$(cat "$QUERY_STRING" 2> /dev/null)";
else
  STATUS=500
fi

echo "Content-type: application/json"
echo "Status: $STATUS"
echo ""
echo "{ \"file\": \"$QUERY_STRING\", \"value\": \""${FILE//\"/\\\"}"\" }"
