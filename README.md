<div class="wrap">

# The Guide

![](http://www.ted.me/wp-content/uploads/2009/11/14641.png)

**Reading Time:** 10 minutes

This document provides a quick introduction to the Hacker Union server. It's a work in
progress -- but skimming it is still a great way to
get started.

The majority of this document discusses the use of the server. In the future,
we'll release additional documentation that explains how the server is built
and managed.

Need to set up SSH access? [Click here][1] for help.

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

###	Core Concepts

The first and most significant concept is the **server**: a node application running on Linux that has full access to the underlying operating system.

We sometimes use the word "server" to refer to the operating system as well as the node application. When we're specifically referring to the node application, we'll identify it as the **kernel**. When we're specifically referring to the operating system, we'll identify it as the **OS**.

We'll also discuss **paths**. These correspond to directories and files within the server's file system.

Paths and URLs are different: the URL is interpreted by the node application (kernel) and the path is interpreted by the operating system (OS). Every path is rooted within the `/srv` directory on the server's filesystem. We generally refer to this as the server's **root**.

We'll also speak broadly of **users**, often in the context of membership, server logins, and OS accounts. These words are used interchangeably: a Hacker Union member is associated with a login on the server as well as a user on the underlying operating system. In fact, the three concepts are equivalent: a Hacker Union member "brandon" is associated with a server login of "brandon" (and thus a OS user named "brandon").


###	Mapping URLs to Paths

The server follows a simple set of rules to dispatch an HTTP request. These are:

 0. Map the URL to a path from the server's root:
   - http://h9n.org/some/path &rarr; `/srv/some/path`
   - http://h9n.org/this/is/another/path &rarr; `/srv/this/is/another/path`
   - http://h9n.org/special/files/.././work/../too &rarr; `/srv/special/too`
 0. If that path corresponds is...
   - **A Directory**: run the index program at that path (`/srv/some/path/index.cgi`)
   - **Executable**: run the program at that path
   - **Readable**: return the data at that path
   - **Something Else**: return an appropriate HTTP error

### 	User Accounts

Hacker Union user accounts are mapped one-to-one with the user accounts on the
server's operating system (Linux). In other words, the username and password
you provide to the website is the same login you'd use with the underlying OS.

All of the files on the server have permissions tied to these user accounts and
groups. The server uses the OS's permissions system to manage access to
files. Since the server runs Linux, these permissions are similar to what
you'd find on any UNIX-like system.


###	Logging In

Despite being backed by the OS's user system, the server handles authentication using
web-based technologies.

Login by visiting this URL:
 - http://h9n.org/sbin/login

Logout by visiting this URL:
 - http://h9n.org/sbin/logout

The `/sbin` URL is special in that the node web application will intercept it before
attempting to access the filesystem. Logging in and logging out are handled explicitly
by the web-based kernel:

You will be prompted for a username and password via Basic Auth. To ensure that
your password is protected, you are encouraged to access the website via SSL
(i.e., using "https://").

Though the login field is presented using Basic Auth, the kernel actually
implements a complete oauth backend. This enables advanced functionality that
you may safely ignore (see "External Apps" to learn more).


###	Default Page

Upon logging in, the server will redirect to the original URL requested. If the URL
is empty (i.e., corresponds to "/"), the following steps are taken:


 - The URL "/" maps to the path `/srv`
   - This is a directory: run `/srv/index.cgi`
 - The `/srv/index.cgi` script forwards to URL "/home/username"
   - The URL "/home/username" maps to the path `/srv/home/username`
 - This is a directory: run `/srv/home/username/index.cgi`
 - The default `/srv/home/username/index.cgi` script runs the **shell** (see below)

In most cases, it's sufficient to remember that logging in will redirect you to
the shell program automatically.


###	Permissions

Upon authenticating, the kernel associates your browser session with the corresponding
user of the underlying OS. This user is referenced when determining how and what data you
may access via the server.

In general, all programs will run under your user account (as if you ran the
program via the underlying OS). Thus, all files created will be "owned" by you
and the running program will have the same permissions that you do. 
 
As an advanced feature, the server supports the `setuid` and `setgid`
permission bits. If a file has these permissions, and is still executable to your
actual user account, it will run as the user (or group) that actually owns the
program.

This is a powerful way to build apps that can access data that other users may
not ordinarily be able to access. You might use this to maintain a shared
database such as a list of top scores or event details.


###	Booting

The server runs a number of scripts on boot. See [`/etc/init.json`][2] within the root
repository to learn more.

---

##	The Shell

###	Overview

The shell is a simple JavaScript application that is hosted by the server.

It is entirely independent from the server's own code and exists as a [set of
ordinary files][3] on the filesystem. It is executed exactly as described above and
is no different from any other CGI application the server.


###	Directory Listing

The left hand side of the shell displays the contents of the current directory.
The symbol after each filename denotes the file's type:

  - Executable &rarr; `*`
  - Directory &rarr; `/`
  - Readable &rarr; `-`

Clicking a directory will bring you into to that directory. You may click the
special `..` path to move to the parent directory.

The path is displayed above the directory listing. You may click any component
of the path to quickly switch to the corresponding directory.


###	File Viewer

The large space to the right of the directory listing is a file viewer.
Clicking a file in the directory listing will cause it to be loaded into this
viewer.

If a file is executable, the file viewer will display the result of running
that file.

If a file is readable, the file viewer will display the contents of the file
using the appropriate handler (see below).


###	Main Menu

At the top of the file viewer is a white bar. This bar allows you to switch
users (using the "sudo" link), show and hide a terminal (using the "+term"
link), and quickly navigate to the server's "home page" (using the "go home"
link).


###	Autoplay Files

The shell will automatically open any files named "index" or "README",
regardless of extension. This is designed to make it easy to hack the shell: by
placing custom JavaScript in an `index.html` file, for instance, you can tweak
and customize the shell's interface.

More typically, however, this technique is used to ensure that a particular file is
automatically displayed when a user moves into a directory.

For instance, to ensure that a help file is shown when accessing the `/srv/info`
directory, one need only save this file as `/srv/info/README`.


###	Rendering Handlers

The shell includes a series of file extension-based rendering handlers. These
are JavaScript extensions that prepare data for being displayed in the shell's
file viewer.

There are currently two rendering handlers:

 - `.md`: These files are interpreted as markdown and converted to HTML
 - `.txt`: These files are escaped and displayed as pre-formatted text

All other files are embedded without escaping in the file viewer. As a result,
HTML tags will be rendered by the browser.


###	Directory Metadata

You can customize the behavior of each directory using a directory metadata
file. These files must be named `.index` and appear in the target directory.
For an example, please see [`/srv/home/guest/.index`][4]

---

##	Writing Code

###	In a Nutshell

Anything you place on the server (via SSH or otherwise) will instantly appear in the shell.
If it doesn't, you may need to reload your browser.

If you write a CGI script (and make it executable), it will run provided that
the logged in user has permission to run it.

If you write a markdown file (and make it readable), it will be presented in
the shell using the most appropriate rendering handler.


###	Example

[SSH][1] into your account using a command such as the following:

		$ ssh -p 1337 username@h9n.org

Next, create a fille called `hello.cgi` with the following contents:

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
will display the file's contents rather than the result of running the program.

To make it executable, you must update its permissions:

		$ chmod u+x hello.cgi

Now when you click the file via the shell, it will be run and its output displayed
in the file viewer.

When someone else attempts to access the file, however, they'll still see the file's
contents.

To fix this, add the execution permission for "other" users:

		$ chmod o+x hello.cgi

With the permissions set correctly, anyone can now run your program from the shell. Rather than seeing its contents, they'll see the output of your app rendered in the file viewer.


###	CGI

All programs are executed via **CGI**: the common gateway interface. This is a
simple and well-worn technology that effectively runs your programs as though
the user were physically sitting at the computer.

Additional information such as GET parameters, POST data, and HTTP headers are
passed via environment variables and through standard input.

See [Wikipedia][5] (or the above example) to learn more about writing CGI
applications. You can also find a number of examples in various [`cgi-bin`][6]
directories on the server.


### Dependencies

You are always free to install dependencies within your home directory. Tools like `pip`,
`npm`, `bundle`, and so forth make this easy.

If you feel that a dependency should be available to everyone on the server, you may add
a script to the [`/etc/rc`][9] directory. The best way to do this is by submitting a 
pull request, or working with an organizer. Note that these scripts must be run every time
the server is synchronized.

Last, if you feel that a dependency is extremely important and should be baked into the
OS image itself, please submit a pull request to the [boot][10] repository.


---

## 	Running Code

*TODO*

---

##	Git Integration

###	Overview

The server's filesystem is synchronized with Git every few hours. You can see
the repository and its contents here:

 - https://github.com/hackerunion/root

The server software (kernel) is included as a submodule and can be seen here:

 - https://github.com/hackerunion/kernel

Last, the scripts to deploy and manage the server can be found here:

 - https://github.com/hackerunion/boot

If you'd like to see the kernel's synchronization logs, you can find the latest
data here:

 - http://h9n.org/var/log/agent


###	Everything is Saved

Changes committed to the repository are automatically deployed when the server
is synchronized.

Similarly, changes to the server's filesystem are committed to the repository
so they aren't lost.

You can think of this as a form of "automatic version control".

Note that the repositories are all public. To learn more about privacy and
security, please read the "Privacy" section.


###	Avoiding Conflicts

Merge conflicts can cause the server the require a manual synchronization with the
repository. Luckily, it's easy to avoid these.

 0. Work mainly in your home directory
 0. If you are modifying shared data, submit your changes via pull request
 0. If you want to store common data, access it via a `setuid` program
 0. Only one person or one program should access any shared data
 0. When collaborating, use a seperate git repository for your work (or a fork)


###	SSH vs Git

You can write code directly on the server via SSH or by forking the root repository and
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
committed to Git as-is.

If a file is not "world readable", it will be encrypted using a secret key that
is only accessible to the kernel. The encryption is performed using GPG.
Once encrypted, the file will be [committed and pushed][7] to the root Git
repository.

Permissions are tracked and recorded using Linux access control lists. These lists
are [stored][8] in version control and are saved and applied whenever the server is
synchronized.

Files are only decrypted once permissions have been restored.


###	Open Data

We encourage all members to embrace openness and transparency. It is always preferable
to share what we can, rather than imposing unnecessary restriction.


###	Disclaimer and Warning

This server is designed to be hacked. Until it has been thoroughly audited and
operated for an extended period if time, it is general safest to avoid putting
sensitive data on the server.

We cannot take responsibility for your data's security or privacy and we make
no guarantees or assurances otherwise.

It is safest to assume that all data on this server is either public or obfuscated
and public.

Note, however, that you are free to use your own cryptographic software to secure
data on the server. This will be exactly as secure as you make it.

---

##	Best Practices

*TODO*

---

##	Implementation Details

*TODO*

[1]: #/home/guest/docs/ssh_info.cgi
[2]: https://github.com/hackerunion/root/tree/master/etc/init.json
[3]: https://github.com/hackerunion/root/blob/master/var/www/shell
[4]: https://github.com/hackerunion/root/blob/master/home/guest/.index
[5]: https://en.wikipedia.org/wiki/Common_Gateway_Interface
[6]: https://github.com/hackerunion/root/tree/master/cgi-bin
[7]: https://github.com/hackerunion/root/tree/master/etc/aws.json
[8]: https://github.com/hackerunion/root/tree/master/etc/permissions.acl
[9]: https://github.com/hackerunion/root/tree/master/etc/rc
[10]: https://github.com/hackerunion/boot
