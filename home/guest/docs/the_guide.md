# The Guide

![](http://www.ted.me/wp-content/uploads/2009/11/14641.png)

**Reading Time:** 10 minutes

This document will introduce you to the Hacker Union server. It's a work in
progress -- but skimming it is still a great way to
get started.

The remainder of this document emphasizes the use of the server. In the future,
we'll release additional documentation that explains how the server is built
and managed.

Have you set up SSH? [Click here][1] for help.

---

## Revisions

 - 6/13/15: First draft

---

## Contents

 0. 	The Server
 0.	The Shell
 0.	Writing Code
 0.	Running Code
 0.	Git Integration
 0.	External Apps
 0.	Privacy
 0.	Best Practices
 0.	Implementation Details

---

##	The Server

###	Concepts

In the following sections, we'll talk about the server. This is a node application running on Linux that has full access to the underlying operating system. We sometimes use the word "server" to refer to the operating system as well as the node application.

We'll also discuss paths. These correspond to directories and files within the server's file system.

Paths and URLs are different: the URL is interpreted by the node application and the path is interpreted by the operating system. Every path is rooted within the `/srv` directory on the server's filesystem.


###	Mapping URLs to Paths

The server follows a very simple set of rules to handle a request. These are:

 - Look at the URL to determine a file path on the server
   - http://h9n.org/some/path 				-- `/srv/some/path`
   - http://h9n.org/this/is/another/path 		-- `/srv/this/is/another/path`
   - http://h9n.org/special/files/.././work/../too 	-- `/srv/special/too`

 - If that path is...
   - A directory: run the index program at that path (`/srv/some/path/index.cgi`)
   - Executable: run the program at that path via CGI
   - Readable: return the data at that path
   - Otherwise: return an appropriate HTTP error

### File Access Rules

Hacker Union user accounts are mapped one-to-one with the user accounts on the
server's operating system (linux). In other words, the username and password
you provide to the website correspond to a user on the server's underlying OS.

All of the files on the server have permissions tied to these same user
accounts. The server uses the OS's permissions system to manage access to
files. Since the server runs linux, these permissions are identical to what
you'd find on any linux computer.


###	Logging In

Despite being powered by linux, the server handles authentication using
web-based technologies.

You can login by visiting this URL:
 - http://h9n.org/sbin/login

And logout by visiting this URL:
 - http://h9n.org/sbin/logout

The `/sbin` URL is special in that the server software will intercept it before
attempting to access the filesystem. Logging in and logging out are handled using
a different flow than the one described above.

You will be prompted for a username and password via Basic Auth. To ensure that
your password is protected, you are encouraged to access the website via SSL
(i.e., using "https://").

Though the login field is presented using Basic Auth, the server actually
implements a complete oauth backend. This enables advanced functionality that
you may safely ignore (see "External Apps" to learn more).


###	Default URL

Upon logging in, the server will redirect to the original path requested. There
is an index file at the server's root that wil redirect to your home directory.
This, in turn, contains an index file that redirets to the shell (described below).

Accessing http://h9n.org/ has the following effect:

 - The URL "/" maps to the path "/srv"
   - This is a directory: run "/srv/index.cgi"
 - The "/srv/index.cgi" script forwards to URL "/home/username"
   - The URL "/home/username" maps to the path "/srv/home/username"
 - This is a directory: run "/srv/home/username/index.cgi"
 - The default "/home/username/index.cgi" script runs the shell

For most purposes, it's sufficient to note that logging in will redirect you to
the shell.


###	Access Rights

Once you have been authenticated, the server has tied you to a user on the
underlying OS. This user is referenced when determining how and what data you
may access on the server.

In general, all programs will run under your user account (as if you ran the
program while logged in to the underlying OS). Thus, all files created will be
"owned" by you and the program will have the same permissions that you do.

As an advanced feature, the server supports the "setuid" and "setgid"
permissions. If a file has these permissions, and is still executable to your
real user account, it will run as the user and/or group that actually owns the
program.

This is a powerful way to build apps that can access data that other users may
not ordinarily be able to access. You might use this to maintain a shared
database such as a list of top scores or event details.


###	Booting

The server runs a number of scripts on boot. See /etc/init.json within the root
repository to learn more.

---

##	The Shell

###	Overview

The shell is a simple javascript application that is hosted by the server.

It is entirely independent from the server's own code and exists as a set of
shared files on the filesystem. It is executed exactly as described above and
is no different from any other CGI application the server.


###	Directory Listing

The left hand side of the shell displays the contents of the current directory.
The symbol after each filename denotes the file's type:

  - Executable: "*"
  - Directory: "/"
  - Plain: "-"

Clicking a directory will bring you into to that directory. You may click the
special ".." item to move to the parent directory.

The path is displayed above the directory listing. You may click any component
of the path to quickly switch to the corresponding directory.


###	File Viewer

The larger space to the right of the directory listing is a file viewer.
Clicking a file in the directory listing will cause it to be loaded into the
file viewer.

If a file is executable, the file viewer will display the result of running
that file.

If a file is readable, the file viewer will display the contents of the file.


###	Main Menu

At the top of the file viewer is a plain bar. This bar allows you to switch
users (using the "sudo" link), show and hide a terminal (using the "+term"
link), and quickly navigate to the server's "home page" (using the "go home"
link).


###	Automatic Files

The shell will automatically run any files named "index" or "README",
regardless of extension. This is designed to make it easy to hack the shell: by
placing custom javascript in an index.html file, for instance, you can inject
your own custom javascript to tweak and tune the shell's interface.

More typically, however, this is used to ensure that a particular file is
automatically displayed when a user moves to a directory. To ensure that a
help file is always shown when accessing "/info", for instance, one need only
store this file as "/info/README" on the file system.


###	Rendering Handlers

The shell includes a series of file-extension based rendering handlers. These
are javascript extensions that prepare data for being displayed in a browser.

At present, the only extensions that are not simply returned as-is are:

 - .md: These files are interpreted as markdown and converted to HTML
 - .html: These files are injected without any escaping (you can even include
  javascript tags)


###	Directory Metadata

You can customize the behavior of each directory using a directory metadata
file. These files must be named ".index" and appear in the directory that you'd
like to customize. For an example of one such file, please look at the guest
user's home directory: ~guest/.index

---

##	Writing Code

###	In a Nutshell

Anything you place on the server (via ssh) will instantly appear in the shell.
If it doesn't, you may need to reload.

If you write a CGI script (and make it executable), it will run provided that
the logged in user has permission to run it.

If you write a markdown file (and make it readable), it will be presented in
the shell as fully rendered HTML.


###	Example

SSH into your account using a command such as the following:

		$ ssh -p 1337 username@h9n.org

Next, create a fille called "hello.cgi" with the following contents:

		1 #!/bin/bash
		2
		3 echo "Content-type: text/html"
		4 echo "Status: 200"
		5 echo
		8 echo "<html>"
		6 echo "<h1>My environment variables:</h1>"
		7 echo "<pre>`env`</pre>"
		8 echo "</html>"

You will already be able to see this file in the shell. Clicking it, however,
will display the file's contents rather than executing the program.

To make it executable, you must update the permissions:

		$ chmod u+x hello.cgi

Now, when you access the file via the shell, it will be executed. However,
when someone else attempts to access the file, they'll still get the source
code.

To fix this, add the execution permission for "other" users:

		$ chmod o+x hello.cgi

Now, when anyone accesses your program via the shell, it will be executed
instead of being returned as data.


###	CGI

All programs are executed via CGI: the common gateway interface. This is a
simple and well-worn technology that effectively runs your programs as though
the user were physically sitting at the computer.

Additional information such as GET parameters, POST data, and HTTP headers are
passed via environment variables and through standard input.

See wikipedia (or the above example example) to learn more about writing CGI
applications as well as the types of data available to your programs.

---

## 	Running Code

*TODO*

---

##	Git Integration

###	Overview

The server's filesystem is synchronized with git every few hours. You can see
the repository and its contents here:

 - http://github.com/hackerunion/root

The server software is included as a submodule and can be seen here:

 - http://github.com/hackerunion/kernel

Last, the scripts to deploy and manage the server can be found here:

 - http://github.com/hackerunion/boot


###	Everything is Saved

Upstream changes are automatically deployed when the server restarts.
Similarly, changes to the server's filesystem are committed to the central
repository so they aren't lost.

You can think of this as a form of "automatic version control".

Note that the repositories are all public. To learn more about privacy and
security, please read the "Privacy" section.


###	SSH vs Git

You can hack on the server itself via SSH or by forking the root repo and
submitting a pull request.

The former is generally best for personal hacks (since pull requests can only
be merged by organizers). For hacks that you'd like to share more broadly, it
is generally best to issue a pull request once your hack is tested and ready
to deploy.

---

##	External Apps

*TODO*

---

##	Privacy

###	Permissions

If a file's permissions are set to "world readable", that file will be
committed to git as-is.

If a file is not "world readable", it will be encrypted using a secret key that
is only accessible to the server. The encryption itself is performed using GPG.
Once encrypted, the file will be committed and pushed to the root git
repository.

Permissions are tracked and persisted using access control lists that are also
stored in version control. These ACLs are saved and restored when the server is
synchronized with the repository. Once permissions are restored, files are
decrypted so as to avoid unauthorized access.


###	Public Data

In general, we encourage our members to keep as much data public as possible --
and especially source code.

Note that the filesystem hierarchy is public since everything is synchronized
with git.


###	Warning

This server is designed to be hacked. Until it has been thoroughly audited and
operated for an extended period if time, it is general safest to avoid putting
truly sensitive data on the server.

We cannot take responsibility for any private data that becomes public as a
result of its usage with this server.

It is probably safest to assume that data on this server is either public or
obfuscated... but still public.

---

##	Best Practices

*TODO*

---

##	Implementation Details

*TODO*

[1]: #/home/guest/docs/ssh_info.cgi
