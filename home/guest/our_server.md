# What's the deal with this server?

In a nutshell: I've taken the best parts of the 90s web (cgi-bin, green text on black backgrounds, massive security holes), mashed it up with docker and AWS and node -- and, well, here we are.

Said less dramatically: I've built an API around a version of linux running in a container. Its filesystem is sync'd to github -- and private files are encrypted before pushing.

It also implements oauth allowing third party apps to "sudo" to your Hacker Union account and access shared data via a trivial API. Neat, right?

What you're using right now is actually a cgi script called the "shell" that lives in `/var/www/shell`. It uses a few scripts in `/cgi-bin/` to `ls` directories and `cat` files. The rest is javascript tomfoolery.

## What's the point?

I wanted something that would be extremely easy to hack, that would be a great place to gather shared resources and data, and that would inspire creativity and shenanigans. What resulted is this server -- a cross between a wiki and an operating system. Does it make sense? I have no idea. Was it fun to build? Yup.

## This is your server!

I wrote a bunch of code. But this is a community-driven project... and, really, it's your community-driven project. Check out the code, mess with some stuff, hax0r teh gibs0n, and submit a pull request or fourteen.

[View source! Fork me! Hack me!][1]

## Proper documentation

I know, I know. This is awful. I'm writing the real documentation now(ish).

## To pwn or not to pwn

It's not hard to poke holes in this bad boy. Should you use that to pwn our megabytes? Probably not: if you find a bug or a security hole or an embarassing n00b mistake, please submit a pull request. We'll reward you with our gratitude (and ice cream).

[1]: http://github.com/hackerunion/
