#!/bin/bash

source "$SERVER_ROOT/usr/lib/bash/cgi/getvar.bash"
source "$SERVER_ROOT/usr/lib/bash/json/escape.bash"

cgi_getvars POST name email username submit 2> /dev/null

VERSION=0
STATUS=200
MESSAGE=
SAVE=

if test -n "$submit"; then
  if echo "$name" | grep -qviE '\S{3,50}'; then
    STATUS=500
    MESSAGE="$MESSAGE<p>Your name is invalid</p>"
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

if test -n "$MESSAGE"; then
  echo "<div style='background: rgba(0, 0, 0, 0.1);'>$MESSAGE</div>"
fi

cat <<EOF
$(whoami)
$(id)
$(env)
<form method="post">
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
    <input type="submit" name="submit" value="Save" />
  </p>
</form>
EOF

if test -n "$SAVE"; then
  echo "$VERSION|$name|$email|$username|`date`" >> "`dirname $0`/data"
fi
