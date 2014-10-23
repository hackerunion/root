root
====

better to use unix concept of user/pw so that we can offload rights/perissions/ownership/setuid messiness

server provides:

CGI-BIN + AUTH, where auth determines what user will run things

we can provide chown, chmod, etc as commands so that access can be controlled

roll up stats/permissions on push?

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
