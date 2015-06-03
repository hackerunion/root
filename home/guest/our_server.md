# About the Hacker Union Server

We've taken the best parts of the 90s web (cgi-bin, green text on black backgrounds, massive security holes), mashed it up with docker and AWS and node -- and, well, here we are.

More precisely, we've built an API around a version of Linux running in a container. Its filesystem is periodically synchronized with [GitHub][2] -- and private files are encrypted before pushing.

The system also implements oauth allowing third party apps to "sudo" to your Hacker Union account and access shared data via a simple REST API. Neat, right?

What you're using right now is actually a CGI script called the _Hacker Union shell_ that lives at `/var/www/shell`. This script uses a few simpler scripts in `/cgi-bin/` to `ls` directories and `cat` files. The rest is javascript tomfoolery.

## The Purpose

We wanted to create a collaborative environment that would be extremely easy to hack: a system that would be a great place to gather shared resources and data.

More than that, we wanted a system htat would inspire creativity and encourage experimentation. What resulted is this server -- a cross between a wiki and an operating system.

## The Community

This is a community-driven project... and you're the community. Check out the code, fix some bugs, submit a pull request. Regardless of what you do: have fun!

[View source][1]

## Get Help

We're in the process of putting together some real documentation. If you're interested in tinkering, feel free to [email us][3] for help and pointers.

## Security Concerns

It's not too hard to poke holes in our server. If you discover something particularly broken, please help out by submitting a pull request. You will be recognized by your peers and offered lots of free ice cream.

[1]: http://github.com/hackerunion/
[2]: http://github.com/hackerunion/root/
[3]: mailto:theevilgeek@gmail.com
