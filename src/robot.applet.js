/*jshint node:true jquery:true*/
"use strict";

module.exports = function(robot) {
	robot.ProgramApplet = function() { return this.init.apply(this, arguments); };
	robot.ProgramApplet.prototype = {
		init: function($container, options) {
			this.applet = new robot.Applet($container, options);

			if (options.state) this.applet.setState(options.state);
			else this.applet.initialState(options);
			
			this.program = function() {};
			this.applet.setStateChangeCallback(this.run.bind(this));
			this.run();
		},

		setProgram: function(program) {
			this.program = program;
			this.run();
		},

		run: function() {
			var r = new robot.Robot(this.applet.getState());
			this.applet.clear();
			this.program(r);
			r.play(this.applet);
		}
	};

	robot.Applet = function() { return this.init.apply(this, arguments); };
	robot.Applet.prototype = {
		init: function($container, options) {
			this.readOnly = options.readOnly || false;
			this.blockSize = options.blockSize || 64;

			this.$container = $container;
			this.$container.on('mouseup', this.containerMouseUp.bind(this));
			this.$container.on('mouseleave', this.containerMouseLeave.bind(this));
			this.$container.addClass('robot-container robot-not-highlighting');

			this.$maze = $('<div class="robot-maze"></div>');
			this.$container.append(this.$maze);

			this.$path = $('<div class="robot-path"></div>');
			this.$container.append(this.$path);

			this.$robot = $('<div class="robot-robot"></div>');
			this.$container.append(this.$robot);
			this.$robot.hide();

			this.$initial = $('<div class="robot-robot robot-initial"></div>');
			this.$container.append(this.$initial);
			if (this.blockSize !== 64) {
				robot.setCss3(this.$initial[0], 'transform', 'scale(' + (this.blockSize/64+0.01) + ')');
			}

			if (!this.readOnly) {
				this.$container.addClass('robot-interactive');
				this.$initial.on('mousedown', this.initialMouseDown.bind(this));
			}

			this.animationManager = new robot.RobotAnimationManager(this.$robot, this.$maze, this.blockSize);
			this.animation = null;
		},

		remove: function() {
			this.clear();
			this.$container.children('.robot-maze-block .robot-maze-line-vertical, .robot-maze-line-horizontal').remove();
			this.animationManager.remove();
			this.lastAnim = null;
			this.$lastElement = null;

			this.$maze.remove();
			this.$path.remove();
			this.$robot.remove();
			this.$container.removeClass('robot-container robot-not-highlighting');
		},

		clear: function() {
			this.$path.children('.robot-path-line, .robot-path-point').remove();
			this.animation = this.animationManager.newAnimation();
			this.lastAnim = null;
			this.$lastElement = null;
		},

		insertDelay: function(delay) { // only to be called right after creating this object with a state
			this.lastAnim = {type: 'delay', x: this.state.initialX, y: this.state.initialY, angle: this.state.initialAngle, length: delay};
			this.animation.add(this.lastAnim);
			this.$lastElement = null;
		},

		insertLine: function(fromX, fromY, toX, toY, angle, goals) {
			var dy = (toY-fromY)*this.blockSize, dx = (toX-fromX)*this.blockSize;
			var angleRad = Math.atan2(dy, dx);
			var length = Math.sqrt(dx*dx+dy*dy);
			var $line = $('<div class="robot-path-line"><div class="robot-path-line-inside"></div></div>');
			$line[0].style.width = Math.round(length) + 'px';
			robot.setCss3($line[0], 'transform', 'rotate(' + (angleRad*180/Math.PI) + 'deg)');
			$line[0].style.left = Math.round(fromX*this.blockSize + (this.blockSize + dx - length)/2) + 'px';
			$line[0].style.top = Math.round(fromY*this.blockSize + (this.blockSize + dy)/2) + 'px';
			this.$path.append($line);

			if (goals !== null) {
				for (var i=0; i<goals.length; i++) {
					goals[i].$block = this.$blocks[goals[i].x][goals[i].y];
				}
			}

			this.lastAnim = {type: 'movement', x: fromX, y: fromY, x2: toX, y2: toY, angle: angle, goals: goals};
			this.animation.add(this.lastAnim);

			this.$lastElement = $line;
		},

		insertPoint: function(x, y, fromAngle, amount) {
			var toAngle = fromAngle+amount;
			var $point = $('<div class="robot-path-point"><div class="robot-path-point-inside"><div class="robot-path-point-arrow"></div></div></div>');
			this.$path.append($point);

			var toAngleRad = toAngle/180*Math.PI;

			// 5 = 0.5*@robot-path-point-arrow-hover
			$point[0].style.left = Math.round(x*this.blockSize + this.blockSize/2 + 5*Math.cos(toAngleRad)) + 'px';
			$point[0].style.top = Math.round(y*this.blockSize + this.blockSize/2 - 5*Math.sin(toAngleRad)) + 'px';
			robot.setCss3($point[0], 'transform', 'rotate(' + (-toAngle) + 'deg)');

			this.lastAnim = {type: 'rotation', x: x, y: y, angle: fromAngle, angle2: toAngle};
			this.animation.add(this.lastAnim);

			this.$lastElement = $point;
		},

		insertDetectWall: function(x, y, angle, wall) {
			this.lastAnim = {type: 'wall', x: x, y: y, angle: angle, wall: wall};
			this.animation.add(this.lastAnim);
			this.$lastElement = null;
			return wall;
		},

		removePathHighlights: function() {
			this.$path.children('.robot-path-highlight').removeClass('robot-path-highlight');
		},

		removeEventHighlights: function() {
			this.$path.children('.robot-path-highlight-event').removeClass('robot-path-highlight-event');
		},

		removeTimeHighlights: function() {
			this.$path.children('.robot-path-highlight-time').removeClass('robot-path-highlight-time');
		},

		highlightVisitedGoal: function(goal) {
			this.$maze.children('.robot-maze-block-goal-blink').removeClass('robot-maze-block-goal-blink');
			if (goal !== null) {
				this.$blocks[goal%this.state.columns][Math.floor(goal/this.state.columns)].addClass('robot-maze-block-goal-blink');
			}
		},

		drawInterface: function() {
			var x, y, $line, $block;

			this.width = this.state.columns * this.blockSize;
			this.height = this.state.rows * this.blockSize;
			this.$container.width(this.width);
			this.$container.height(this.height);

			// inits
			this.$maze.children('.robot-maze-block, .robot-maze-line-vertical, .robot-maze-line-horizontal').remove();
			this.$verticalLines = [];
			this.$horizontalLines = [];
			this.$blocks = [];
			for (x=0; x<this.state.columns; x++) {
				this.$verticalLines[x] = [];
				this.$horizontalLines[x] = [];
				this.$blocks[x] = [];
			}

			// blocks
			for (x=0; x<this.state.columns; x++) {
				for (y=0; y<this.state.rows; y++) {
					$block = $('<div class="robot-maze-block"></div>');
					$block[0].style.left = (x*this.blockSize) + 'px';
					$block[0].style.top = (y*this.blockSize) + 'px';
					$block.width(this.blockSize);
					$block.height(this.blockSize);
					$block.data('x', x);
					$block.data('y', y);
					if (this.state.blockGoal[x][y]) $block.addClass('robot-maze-block-goal');
					this.$maze.append($block);
					this.$blocks[x][y] = $block;
				}
			}

			// vertical lines
			for (y=0; y<this.state.rows; y++) {
				for (x=1; x<this.state.columns; x++) {
					$line = $('<div class="robot-maze-line-vertical"><div class="robot-maze-line-inside"></div></div>');
					$line[0].style.left = (x*this.blockSize) + 'px';
					$line[0].style.top = (y*this.blockSize) + 'px';
					$line.height(this.blockSize);
					$line.data('x', x);
					$line.data('y', y);
					if (this.state.verticalActive[x][y]) $line.addClass('robot-maze-line-active');
					this.$maze.append($line);
					this.$verticalLines[x][y] = $line;
				}
			}

			// horizontal lines
			for (x=0; x<this.state.columns; x++) {
				for (y=1; y<this.state.rows; y++) {
					$line = $('<div class="robot-maze-line-horizontal"><div class="robot-maze-line-inside"></div></div>');
					$line[0].style.left = (x*this.blockSize) + 'px';
					$line[0].style.top = (y*this.blockSize) + 'px';
					$line.width(this.blockSize);
					$line.data('x', x);
					$line.data('y', y);
					if (this.state.horizontalActive[x][y]) $line.addClass('robot-maze-line-active');
					this.$maze.append($line);
					this.$horizontalLines[x][y] = {$line: $line, active: false};
				}
			}

			if (!this.readOnly) {
				$('.robot-maze-block').click(this.clickBlock.bind(this));
				$('.robot-maze-line-vertical').click(this.clickVerticalLine.bind(this));
				$('.robot-maze-line-horizontal').click(this.clickHorizontalLine.bind(this));
			}

			this.drawInitial();
		},

		drawInitial: function() {
			this.$initial[0].style.left = (this.state.initialX * this.blockSize + this.blockSize/2) + 'px';
			this.$initial[0].style.top = (this.state.initialY * this.blockSize + this.blockSize/2) + 'px';
		},

		forcePlay: function() {
			this.animationManager.forcePlay(0, Infinity);
		},

		play: function() {
			this.animationManager.play(0, Infinity);
		},

		stop: function() {
			this.animationManager.stop();
		},

		getState: function() {
			return JSON.stringify(this.state);
		},

		setState: function(state) {
			this.state = JSON.parse(state);
			this.drawInterface();
			this.clear();
		},

		initialState: function(options) {
			var columns = options.columns || 8, rows = options.rows || 8;
			this.state = {
				columns: columns,
				rows: rows,
				initialX: Math.floor(columns/2),
				initialY: rows-1,
				initialAngle: 90,
				mazeObjects: 0,
				verticalActive: [],
				horizontalActive: [],
				blockGoal: []
			};
			for (var x=0; x<columns; x++) {
				this.state.verticalActive[x] = [];
				this.state.horizontalActive[x] = [];
				this.state.blockGoal[x] = [];
				for (var y=0; y<rows; y++) {
					this.state.verticalActive[x][y] = false;
					this.state.horizontalActive[x][y] = false;
					this.state.blockGoal[x][y] = false;
				}
			}
		},

		setStateChangeCallback: function(callback) {
			this.stateChangeCallback = callback;
		},

		clickVerticalLine: function(event) {
			var $target = $(event.delegateTarget);
			var active = !this.state.verticalActive[$target.data('x')][$target.data('y')];
			this.state.verticalActive[$target.data('x')][$target.data('y')] = active;
			if (active) {
				this.state.mazeObjects++;
				$target.addClass('robot-maze-line-active');
			} else {
				this.state.mazeObjects--;
				$target.removeClass('robot-maze-line-active');
			}
			this.stateChanged();
		},

		clickHorizontalLine: function(event) {
			var $target = $(event.delegateTarget);
			var active = !this.state.horizontalActive[$target.data('x')][$target.data('y')];
			this.state.horizontalActive[$target.data('x')][$target.data('y')] = active;
			if (active) {
				this.state.mazeObjects++;
				$target.addClass('robot-maze-line-active');
			} else {
				this.state.mazeObjects--;
				$target.removeClass('robot-maze-line-active');
			}
			this.stateChanged();
		},

		clickBlock: function(event) {
			var $target = $(event.delegateTarget);
			var goal = !this.state.blockGoal[$target.data('x')][$target.data('y')];
			this.state.blockGoal[$target.data('x')][$target.data('y')] = goal;
			if (goal) {
				this.state.mazeObjects++;
				$target.addClass('robot-maze-block-goal');
			} else {
				this.state.mazeObjects--;
				$target.removeClass('robot-maze-block-goal');
			}
			this.stateChanged();
		},

		initialMouseDown: function(event) {
			var offset = this.$container.offset();
			if (!this.draggingInitial) {
				this.draggingInitial = true;
				this.dragX = (event.pageX - offset.left)%this.blockSize - this.blockSize/2;
				this.dragY = (event.pageY - offset.top)%this.blockSize - this.blockSize/2;
				this.$container.on('mousemove', this.containerMouseMove.bind(this));
				this.$initial.addClass('robot-initial-dragging');
				event.preventDefault();
				this.drawInitial();
			}
		},

		containerMouseUp: function(event) {
			if (this.draggingInitial) {
				this.$container.off('mousemove');
				this.$initial.removeClass('robot-initial-dragging');
				this.draggingInitial = false;
				this.drawInitial();
			}
		},

		containerMouseLeave: function(event) {
			if (this.draggingInitial) {
				this.$container.off('mousemove');
				this.$initial.removeClass('robot-initial-dragging');
				this.draggingInitial = false;
				this.drawInitial();
			}
		},

		containerMouseMove: function(event) {
			var offset = this.$container.offset();
			var x = Math.floor((event.pageX - offset.left)/this.blockSize);
			var y = Math.floor((event.pageY - offset.top)/this.blockSize);

			if (x !== this.state.initialX || y !== this.state.initialY) {
				this.state.initialX = x;
				this.state.initialY = y;
				this.stateChanged();
			}
			this.$initial[0].style.left = (event.pageX - offset.left - this.dragX) + 'px';
			this.$initial[0].style.top = (event.pageY - offset.top - this.dragY) + 'px';
		},

		stateChanged: function() {
			if (this.stateChangeCallback) {
				this.stateChangeCallback(this.getState());
			}
		}
	};
};