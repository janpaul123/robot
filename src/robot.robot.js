/*jshint node:true jquery:true*/
"use strict";

module.exports = function(robot) {
	robot.Robot = function() { return this.init.apply(this, arguments); };
	robot.Robot.prototype = {
		init: function(state) {
			this.calls = [];
			this.state = JSON.parse(state);
			this.robotX = this.state.initialX;
			this.robotY = this.state.initialY;
			this.robotAngle = this.state.initialAngle;
			this.visitedGoals = [];
		},

		primitiveDrive: function(name, args, forward) {
			var goals = null, fromX = this.robotX, fromY = this.robotY;
			try {
				var amount = 1;
				if (args[0] !== undefined) {
					amount = args[0];
				}
				if (!forward) amount = -amount;

				if (args.length > 1) {
					throw '<var>' + name + '</var> accepts no more than <var>1</var> argument';
				} else if (typeof amount !== 'number' || !isFinite(amount)) {
					throw 'Argument has to be a valid number';
				} else if (Math.round(amount) !== amount && this.state.mazeObjects > 0) {
					throw 'Fractional amounts are only allowed when the maze is empty';
				} else if (amount !== 0) {
					if (this.state.mazeObjects > 0) {
						var positive = amount > 0;

						for (var i=0; i<Math.abs(amount); i++) {
							if (this.primitiveIsWall(this.robotX, this.robotY, positive ? this.robotAngle : (this.robotAngle + 180)%360)) {
								throw 'Robot ran into a wall';
							}
							if (this.robotAngle === 0) {
								this.robotX += (positive ? 1 : -1);
							} else if (this.robotAngle === 90) {
								this.robotY -= (positive ? 1 : -1);
							} else if (this.robotAngle === 180) {
								this.robotX -= (positive ? 1 : -1);
							} else if (this.robotAngle === 270) {
								this.robotY += (positive ? 1 : -1);
							}
							if (this.state.blockGoal[this.robotX][this.robotY]) {
								var goal = {x: this.robotX, y: this.robotY, amount: i+1};
								if (goals === null) {
									goals = [goal];
								} else {
									goals.push(goal);
								}

								if (this.visitedGoals.indexOf(this.robotX+this.robotY*this.state.columns) < 0) {
									this.visitedGoals.push(this.robotX+this.robotY*this.state.columns);
								}
							}
						}
					} else {
						this.robotX += Math.cos(this.robotAngle / 180 * Math.PI)*amount;
						this.robotY -= Math.sin(this.robotAngle / 180 * Math.PI)*amount;
					}
				}
			} finally {
				this.calls.push({name: 'insertLine', args: [fromX, fromY, this.robotX, this.robotY, this.robotAngle, goals]});
			}
		},

		primitiveTurn: function(name, args, clockwise) {
			var fromAngle = this.robotAngle, amount = 90;
			if (args[0] !== undefined) {
				amount = args[0];
			}

			if (args.length > 1) {
				throw '<var>' + name + '</var> accepts no more than <var>1</var> argument';
			} else if (typeof amount !== 'number' || !isFinite(amount)) {
				throw 'Argument has to be a valid number';
			} else if ([0, 90, 180, 270].indexOf((amount%360+360)%360) < 0 && this.state.mazeObjects > 0) {
				throw 'Only <var>90</var>, <var>180</var> and <var>270</var> degrees are allowed when the maze is not empty';
			} else {
				if (clockwise) amount = -amount;
				this.robotAngle = ((this.robotAngle+amount)%360+360)%360;
			}
			this.calls.push({name: 'insertPoint', args: [this.robotX, this.robotY, fromAngle, amount]});
		},

		primitiveIsWall: function(x, y, angle) {
			if (this.state.mazeObjects <= 0) {
				return false;
			} else {
				if (angle === 0) {
					if (x >= this.state.columns-1 || this.state.verticalActive[x+1][y]) {
						return true;
					}
				} else if (angle === 90) {
					if (y <= 0 || this.state.horizontalActive[x][y]) {
						return true;
					}
				} else if (angle === 180) {
					if (x <= 0 || this.state.verticalActive[x][y]) {
						return true;
					}
				} else if (angle === 270) {
					if (y >= this.state.rows-1 || this.state.horizontalActive[x][y+1]) {
						return true;
					}
				}
				return false;
			}
		},

		primitiveIsGoal: function(x, y) {
			if (this.state.mazeObjects <= 0) return false;
			else return this.state.blockGoal[x][y];
		},

		primitiveDetectWall: function(name, args) {
			var wall = this.primitiveIsWall(this.robotX, this.robotY, this.robotAngle);
			this.calls.push({name: 'insertDetectWall', args: [this.robotX, this.robotY, this.robotAngle, wall]});
			return wall;
		},

		primitiveDetectGoal: function(name, args) {
			return this.primitiveIsGoal(this.robotX, this.robotY);
		},

		drive: function() {
			return this.primitiveDrive('drive', arguments, true);
		},

		turnLeft: function() {
			return this.primitiveTurn('turnLeft', arguments, false);
		},

		turnRight: function() {
			return this.primitiveTurn('turnRight', arguments, true);
		},

		detectWall: function() {
			return this.primitiveDetectWall('detectWall', arguments);
		},

		detectGoal: function() {
			return this.primitiveDetectGoal('detectGoal', arguments);
		},

		getCalls: function() {
			return this.calls;
		},

		play: function(applet) {
			applet.clear();
			for (var i=0; i<this.calls.length; i++) {
				applet[this.calls[i].name].apply(applet, this.calls[i].args);
			}
			applet.play();
		}
	};
/*
	output.Robot = function() { return this.init.apply(this, arguments); };
	output.Robot.prototype = {
		/// INTERNAL FUNCTIONS ///
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

		addCall: function(context) {
			if (this.callCounter++ > 300) {
				context.throwTimeout();
			}
			var $element = this.robot.$lastElement;
			if ($element !== null) {
				$element.data('eventPosition', this.eventPosition);
				$element.data('index', this.events[this.eventPosition].calls.length);
				$element.on('mousemove', this.pathMouseMove.bind(this));
				$element.on('mouseleave', this.pathMouseLeave.bind(this));
			}
			this.events[this.eventPosition].calls.push({
				stepNum: context.getStepNum(),
				nodeId: context.getCallNodeId(),
				callId: context.getCallId(),
				$element: $element,
				animNum: this.robot.animation.getLength()-1
			});
			this.events[this.eventPosition].endAnimNum = this.robot.animation.getLength();
		},

		updateInterface: function() {
			if (!this.readOnly) {
				$('.robot-maze-block').click(this.clickBlock.bind(this));
				$('.robot-maze-line-vertical').click(this.clickVerticalLine.bind(this));
				$('.robot-maze-line-horizontal').click(this.clickHorizontalLine.bind(this));
			}
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

		pathMouseMove: function(event) {
			if (this.highlighting) {
				var $target = $(event.delegateTarget);
				if ($target.data('eventPosition') === this.eventPosition &&
						this.events[this.eventPosition].calls[$target.data('index')] !== undefined) {
					if (!$target.hasClass('robot-path-highlight')) {
						this.robot.removePathHighlights();
						$target.addClass('robot-path-highlight');
						this.editor.highlightNodeId(this.events[this.eventPosition].calls[$target.data('index')].nodeId);
					}
				} else {
					this.robot.removePathHighlights();
					this.editor.highlightNodeId(0);
				}
			}
		},

		pathMouseLeave: function(event) {
			if (this.highlighting) {
				this.robot.removePathHighlights();
				this.editor.highlightNodeId(0);
			}
		},

		initialMouseDown: function(event) {
			var offset = this.$container.offset();
			if (!this.draggingInitial) {
				this.draggingInitial = true;
				this.dragX = (event.pageX - offset.left)%blockSize - blockSize/2;
				this.dragY = (event.pageY - offset.top)%blockSize - blockSize/2;
				this.$container.on('mousemove', this.containerMouseMove.bind(this));
				this.robot.$initial.addClass('robot-initial-dragging');
				event.preventDefault();
				this.robot.drawInitial();
			}
		},

		containerMouseUp: function(event) {
			if (this.draggingInitial) {
				this.$container.off('mousemove');
				this.robot.$initial.removeClass('robot-initial-dragging');
				this.draggingInitial = false;
				this.robot.drawInitial();
			}
		},

		containerMouseLeave: function(event) {
			if (this.draggingInitial) {
				this.$container.off('mousemove');
				this.robot.$initial.removeClass('robot-initial-dragging');
				this.draggingInitial = false;
				this.robot.drawInitial();
			}
		},

		containerMouseMove: function(event) {
			var offset = this.$container.offset();
			var x = Math.floor((event.pageX - offset.left)/blockSize);
			var y = Math.floor((event.pageY - offset.top)/blockSize);

			if (x !== this.state.initialX || y !== this.state.initialY) {
				this.state.initialX = x;
				this.state.initialY = y;
				this.stateChanged();
			}
			this.robot.$initial.css('left', event.pageX - offset.left - this.dragX);
			this.robot.$initial.css('top', event.pageY - offset.top - this.dragY);
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

		stateChanged: function() {
			this.editor.outputRequestsRerun();
			if (this.stateChangeCallback !== null) {
				this.stateChangeCallback(this.getState());
			}
		}
	};*/
};