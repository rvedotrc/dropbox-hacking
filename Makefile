default: build

install:
	yarn

uninstall:
	rm -rf node_modules */node_modules

format:
	@echo Prettier
	@set -o pipefail ; yarn --silent exec -- prettier --write . | ( grep -vw unchanged || : )

build.js: install build.ts tsconfig.json
	@echo Compile build.js
	@yarn --silent exec tsc

build: install format build.js
	@echo Build
	@node ./build.js

clean:
	rm -rf */dist */tsconfig.tsbuildinfo

very-clean: clean uninstall
