#!/bin/bash

echo Content-type: text/plain
echo Status: 200
echo

cat <<EOF
SSH Guide
=========

> You are logged in as "$USER"
> To switch accounts, click the "(sudo)" link in the upper right

Username:	$USER
SSH server:	$SERVER_NAME
SSH port:	$HOST_SSH_PORT


Instructions
============

1. Obtain an ssh client (try typing "ssh" into a terminal)
2. Connect to the server:

	ssh -p $HOST_SSH_PORT $USER@$SERVER_NAME

3. Answer yes to any reasonable prompts
4. Enter your password
5. You're all done


Via Web
=======

1. Go to $SERVER_NAME
2. Click the "+term" link in the top right corner
3. Enter "$USER" as your username
4. Enter your password
5. You're all done


What Next?
==========

We highly suggest that you skim The Guide:

http://h9n.org/#/home/guest/docs/the_guide.md

EOF
