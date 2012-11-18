all: main example

main: robot.js robot.min.js robot.css robot.min.css

robot.js: src/*.js
	node_modules/.bin/browserify src/index.js -d -o robot.js

robot.min.js: src/*.js
	node_modules/.bin/browserify src/index.js -o robot.min.js

robot.css: src/*.less
	node_modules/.bin/lessc src/index.less | node_modules/.bin/imgbase > robot.css

robot.min.css: src/*.less
	node_modules/.bin/lessc -x src/index.less | node_modules/.bin/imgbase > robot.min.css

example: example/js/robot.js example/css/robot.css example/css/main.css

example/css/main.css: example/css/main.less
	node_modules/.bin/lessc example/css/main.less > example/css/main.css

example/js/robot.js: robot.js
	cp robot.js example/js/robot.js

example/css/robot.css: robot.css
	cp robot.css example/css/robot.css

clean:
	rm -f robot.js robot.min.js robot.css robot.min.css
	rm -f example/js/robot.js example/css/robot.css

.PHONY: clean main example
