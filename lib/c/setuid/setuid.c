#include <stdio.h>
#include <unistd.h>
#include <assert.h>

extern char **environ;

int main(int argc, char *argv[]) {
	assert(argc >= 2);
	setreuid(geteuid(), geteuid());
	system(argv[1]);
	return 0;
}
