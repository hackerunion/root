#include <stdio.h>
#include <unistd.h>

int main() {
  int real = getuid();
  int euid = geteuid();

  printf("The REAL UID =: %d\n", real);
  printf("The EFFECTIVE UID =: %d\n", euid);

  setreuid(geteuid(), getuid());

  int real2 = getuid();
  int euid2 = geteuid();

  printf("The next REAL UID =: %d\n", real2);
  printf("The next EFFECTIVE UID =: %d\n", euid2);

  return 0;
}
