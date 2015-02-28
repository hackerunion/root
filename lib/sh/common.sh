# Helper utilities for working with system files

field() {
  JSON="$1"
	ENTRY="$2"
	FIELD="$3"
	echo "$JSON" | grep -i "\[$ENTRY,\"$FIELD\".*\]" | cut -f 2 | sed -e 's/^"\(.*\)"$/\1/'
}

fields() {
  echo "$1" | cut -f 1 | tr -d ',[]"0-9' | sort | uniq -c
}

last() {
  JSON="$1"
	l=`echo "$JSON" | cut -d',' -f1 | cut -c2- | sort -rn | head -1`
	echo ${l:--1}
}

array() {
  RESULT=`echo "$1" | json -b`
  (( $? )) || ( echo "$RESULT" | cut -f2 | tr -d '"' )
}

public() {
  find "$1" -type f -perm -004
}

private() {
  find "$1" -type f \! -perm -004
}

bool() {
	[ -n "$1" ] && [ "$1" != "false" ] && echo "true"
}
