#!/bin/bash

set -eu
printf "build.js: build.ts tsconfig.json\n\tyarn --silent exec tsc\n" | make --quiet -f -
node ./build.js "$@"
exit
