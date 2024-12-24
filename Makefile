default: build

install:
	yarn

uninstall:
	rm -rf node_modules */node_modules

format:
	yarn --silent exec -- prettier --write .

build.js: install build.ts tsconfig.json
	yarn --silent exec tsc

build: install format build.js
	node ./build.js

clean:
	rm -rf */dist */tsconfig.tsbuildinfo

very-clean: clean uninstall
