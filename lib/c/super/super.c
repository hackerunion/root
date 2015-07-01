#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

int main(int argc, char *argv[]) {
    if (argc <= 1) {
        printf("USAGE: %s path [arg1] [arg2] ... [argN]\n", *argv);
        exit(1);
    }   

    const char* pathname = argv[1];
    struct stat info;

    uid_t uid = getuid();
    gid_t gid = getgid();
    
    printf("[super] Starting as uid=%d gid=%d\n", uid, gid);

    if (access(pathname, X_OK | R_OK)) {
        perror("Access denied");
        exit(2);
    }   
    
    if (stat(pathname, &info)) {
        perror("Couldn't inspect file");
        exit(3);
    }   
    
    if (info.st_mode & S_ISUID) {
        uid = info.st_uid;
    }   

    if (info.st_mode & S_ISGID) {
        gid = info.st_gid;
    }   
    
    printf("[super] Running as uid=%d gid=%d\n", uid, gid);

    if(setregid(gid, gid)) {
        perror("Unable to set GID");
        exit(4);
    }   

    if(setreuid(uid, uid)) {
        perror("Unable to set UID");
        exit(5);
    }   
    
    execvp(argv[1], argv + 1); 
    
    perror("Exec failed!");
    return 1;
}
