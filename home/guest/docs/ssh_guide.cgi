#!/bin/bash

echo Content-type: text/plain
echo Status: 200
echo

cat <<EOF
SSH Guide
=========

> You are logged in as "$USER"

Username:	$USER 		(guest = not logged in)
SSH server:	$SERVER_NAME
SSH port:	$HOST_SSH_PORT


Instructions
============

1. Obtain an ssh client (try typing "ssh" into a terminal)
2. Connect to the server:

	ssh -p $HOST_SSH_PORT $USER@$SERVER_NAME

3. Answer yes to any reasonable prompts
4. Type your password
5. You're in!


Via Web
=======

1. Go to $SERVER_NAME
2. Click the "+term" link in the top right corner
3. Enter "$USER" as your username
4. Type your password
5. You're in!


What Next?
==========

This directory contains a number of documents designed to help you get the most out of your Hacker Union membership. Read on, brave hacker!
EOF
