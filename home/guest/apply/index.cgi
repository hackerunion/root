#!/bin/bash

source "$SERVER_ROOT/usr/lib/bash/cgi/getvar.bash"
source "$SERVER_ROOT/usr/lib/bash/json/escape.bash"

cgi_getvars POST name email username note submit 2> /dev/null

VERSION=1
STATUS=200
MESSAGE=
SAVE=

NOTE=`cat<<EOF
1. What is your technical background?

2. How can Hacker Union help you?

3. How can you help Hacker Union?

4. Any links we should check out?

EOF`

if test -n "$submit"; then
  if echo "$name" | grep -qviE '\S{3,50}'; then
    STATUS=500
    MESSAGE="$MESSAGE<p>Your name is invalid</p>"
  fi

  if echo "$note" | grep -qiE '.{5000,}'; then
    STATUS=500
    MESSAGE="$MESSAGE<p>Your note is invalid</p>"
  fi

  if echo "$email" | grep -qviE '.{1,100}@.{1,100}'; then
    STATUS=500
    MESSAGE="$MESSAGE<p>Your email address is invalid</p>"
  fi

  if echo "$username" | grep -qviE '[a-z0-9]{2,10}'; then
    STATUS=500
    MESSAGE="$MESSAGE<p>Your username is invalid</p>"
  fi

  if (( $STATUS == 200 )); then
    MESSAGE="<p>Your request has been saved!</p>"
    SAVE=true
  fi
fi

echo "Content-type: text/html"
echo "Status: $STATUS"
echo ""

cat <<EOF
<style type="text/css">
  p, label, input {
    font-family: sans-serif !important;
  }
</style>
EOF

if test -n "$MESSAGE"; then
  echo "<div style='font-weight: bold; background: rgb(255, 255, 0);'>$MESSAGE</div>"
fi

cat <<EOF
<form method="POST">
  <input type="hidden" name="ip" value="$REMOTE_ADDR" />
  <p>
    <label>Your name:<br /><input type="text" name="name" value="$name" /></label>
  </p>

  <p>
    <label>Your email:<br /><input type="text" name="email" value="$email" /></label>
  </p>

  <p>
    <label>Desired username:<br /><input type="text" name="username" value="$username" /></label>
  </p>

  <p>
    <label>Application notes:<br /><textarea rows="10" cols="60" name="note">${note:-$NOTE}</textarea></label>
  </p>

  <p>
    <input type="submit" name="submit" value="Save" />
  </p>
</form>
EOF

if test -n "$SAVE"; then
  note="`echo $note | sed -e 's/[[:space:]]/ /g'`"

  # Remove duplicates
  # cat "`dirname $0`/data" | grep -v "$VERSION|$REMOTE_ADDR|" > "`dirname $0`/data"

  echo "$VERSION|$REMOTE_ADDR|$name|$email|$username|`date`|$note" >> "`dirname $0`/data"
fi
