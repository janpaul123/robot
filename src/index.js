/*jshint node:true*/
"use strict";

var robot = {};

var firstUpper = function(value) {
	return value[0].toUpperCase() + value.substring(1);
};

robot.setCss3 = function(element, name, value, addBrowserToValue) {
	addBrowserToValue = addBrowserToValue || false;
	var browsers = ['', '', 'moz', 'webkit', 'o'];
	var browsersCSS = ['', '-ms-', '-moz-', '-webkit-', '-o-'];
	for (var i=0; i<browsers.length; i++) {
		var cssName = browsers[i] + firstUpper(name);

		var cssValue = value;
		if (addBrowserToValue && browsersCSS[i])
			cssValue = browsersCSS[i] + value;

		element.style[cssName] = cssValue;
	}
};

require('./robot.animation')(robot);
require('./robot.manager')(robot);
require('./robot.applet')(robot);
require('./robot.robot')(robot);

module.exports = robot;

window.jsdares = window.jsdares || {};
window.jsdares.robot = window.jsdares.robot || robot;
