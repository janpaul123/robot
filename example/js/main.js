var exampleTop = new window.jsdares.robot.ProgramApplet($('.robot-example-top'), {readOnly: false, blockSize: 64, state: '{"columns":8,"rows":8,"initialX":3,"initialY":4,"initialAngle":90,"mazeObjects":50,"verticalActive":[[false,false,false,false,false,false,false,false],[false,false,true,true,true,false,true,false],[false,true,false,false,true,false,false,true],[false,false,true,true,false,false,true,false],[false,true,true,false,false,false,false,false],[false,false,false,true,false,true,true,false],[false,false,true,false,true,true,false,false],[false,false,false,true,true,true,true,false]],"horizontalActive":[[false,true,false,false,true,false,false,true],[false,true,false,true,false,false,true,false],[false,true,true,false,true,false,true,false],[false,true,false,false,true,true,true,false],[false,false,true,true,false,true,false,true],[false,true,false,false,true,false,false,true],[false,true,true,true,false,false,false,true],[false,true,true,false,false,false,false,false]],"blockGoal":[[false,false,false,true,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false]],"numGoals":1}'});
exampleTop.setProgram(function (robot) {
	for (var i=0; i<400; i++) {
		if (robot.detectGoal()) break;
		robot.turnLeft();
		if (robot.detectWall()) {
			robot.turnRight();
		}
		if (robot.detectWall()) {
			robot.turnRight();
		}
		if (robot.detectWall()) {
			robot.turnRight();
		}
		if (robot.detectWall()) {
			break;
		}
		robot.drive(1);
	}
});

var makeExample = function(nr, code, options) {
	var editor, example = new window.jsdares.robot.ProgramApplet($('.robot-example-' + nr), options);
	var update = function() {
		var func = null;
		try {
			func = eval('(function (robot) { ' + editor.getValue() + '});');
			if (func) example.setProgram(func);
		} catch(e) {}
	};
	editor = new CodeMirror($('.robot-example-' + nr + '-editor')[0], {
		value: code,
		onChange: update
	});
	update();
};

makeExample(1, 'robot.drive(1);\nrobot.turnRight();\nrobot.drive(2);\nrobot.turnLeft();\nrobot.drive(2);\nrobot.turnLeft();\nrobot.drive(3);', {readOnly: false, blockSize: 48, state: '{"columns":5,"rows":5,"initialX":2,"initialY":4,"initialAngle":90,"mazeObjects":5,"verticalActive":[[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false]],"horizontalActive":[[false,false,false,true,false],[false,false,false,true,false],[false,false,false,true,false],[false,false,false,true,false],[false,false,false,false,false]],"blockGoal":[[false,false,false,false,false],[false,true,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false]]}'});
makeExample(2, 'for (var i=0; i<100; i++) {\n  robot.drive(0.3);\n  robot.turnRight(10);\n}', {readOnly: false, blockSize: 48, state: '{"columns":5,"rows":5,"initialX":0,"initialY":2,"initialAngle":90,"mazeObjects":0,"verticalActive":[[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false]],"horizontalActive":[[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false]],"blockGoal":[[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false],[false,false,false,false,false]]}'});

