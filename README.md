root
====

Hello from the server!

Reminder: ROOT env variable must not have a trailing "/"

conforms to http://www.pathname.com/fhs/pub/fhs-2.3.html

better to use unix concept of user/pw so that we can offload rights/perissions/ownership/setuid messiness

server provides:

CGI-BIN + AUTH, where auth determines what user will run things

we can provide chown, chmod, etc as commands so that access can be controlled

roll up stats/permissions on push?

notes
=====

latest stuff:

- there should be a way to switch to "readonly" so that we can bundle fs, push, pull, re-deply, then redirect
- i.e., vm1 => readonly >> vm1 => push >> vm2 ==> pull >> vm2 ==> readwrite >> vm2 [replace] vm1 >> vm1 => halt
- also, don't forget that the convention is hidden files are shared (i.e., ".whatever" must only be app-modified)

old stuff:

once user logs in via basic auth, the Authorization header is set to basic credentials. This causes conflict
with the oauth server, which expects ONE of query, body, or this header to contain a token. Since in some
cases the query AND the header contain a token, an error is raised. In other instances, when logging in,
the header contains a completely invalid token.

We need a way for users to login and then to access the site in a way that is consistent with the API. Maybe
we redirect the user to a url with a `access_token` parameter? This would require that all URLs are private...

We can also "convert" the basic auth into an access token via the Bearer syntax. This might work but is a bit
ugly.

What we need is a way to fetch the token from the session (for logged in users only!), and inject this as the
token considered for authentication flows. I think maybe a middleware that handles this (augmentedOauth?) could
do the trick...

1. if user is logged in...
2. ensure authorization header is set to the appropriate token, ignoring basic auth header
3. it might make sense for logging in to "disable" API access since apis shouldn't be "logged in"

spec
====

The server consists of a nodejs daemon running within a docker container.
 
The server’s primary function is to provide authentication via OAuth2 and to federate access to the filesystem.
 
Authentication is managed by the underlying operating system.
 
Once a user is authenticated, the daemon assumes the credentials of the user and attempts to fulfill the request.
 
If the requested file is executable, it will be evaluated as a CGI program in the context of the current request and current user. The output will be returned directly.
 
If the requested file is a directory, the index file will be returned. If there is no index file, a directory listing will be returned.
 
All other files will be returned as-is.
 
Users interact with the system via a git repository. The repository is automatically deployed on every successful push.
 
Deployment occurs by requisitioning a new docker container running the server software. The user database is used to generate corresponding UNIX accounts. Permanent storage is associated with each user account.
 
The earlier instance is disconnected with the new instance injected as a replacement.
 
By convention, files with “.shared” extensions should not be modified outside of the server process. Doing so can lead to merge conflicts which halt deployment and generate a notification to administrators.
 
During a re-deploy, the server determines whether any managed directories are dirty. If the directories are dirty, the initial deploy is cancelled and a new push is issued to the repository. This, in turn, leads to a re-deploy.

All output is subject to final security processing. A secure mapping of opaque tokens to values is maintained in an encrypted, shared database. These mappings are used to replace tokens within the output stream to their corresponding decrypted values.
