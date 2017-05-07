var slabScale = 10;
var bitWidth = 2;
var canvasWidth;
var canvasHeight;
var cutDepth = 6;
var maxCutDepth = 6;
var plungeRate = 1000;
var cutRate = 1000;
var moveRate = 3000;
var moveHeight = 3;
var newline = "\r";
var currentX = 0;
var currentY = 0;
var currentZ = 0;
var currentPathIndex = 0;
var donePositions;
var gCode = "";
var layer;
var path;
var offset = Math.round((bitWidth * slabScale) / 2);
var pixels;

function getGCode(canvas) {
	var context = canvas.getContext("2d");
	var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	pixels = imageData.data;

	canvasWidth = canvas.width;
	canvasHeight = canvas.height;


	var makeWhite = [];

	for (var x = 0; x < canvasWidth; x++) {
		for (var y = 0; y < canvasHeight; y++) {
			var loc = (x + y * canvasWidth) * 4;
			var color = pixels[loc];
			if (color != 255) {
				var keep = checkPixel(x - 1, y);
				
				if (!keep) {
					keep = checkPixel(x, y - 1);
				}
				
				if (!keep) {
					keep = checkPixel(x + 1, y);
				}
				
				if (!keep) {
					keep = checkPixel(x, y + 1);
				}

				if (!keep) {
					makeWhite.push({ X: x, Y: y });
				}
			}
		}
	}

	for (var i = 0; i < makeWhite.length; i++) {
		var pos = makeWhite[i];
		var loc = (pos.X + pos.Y * canvasWidth) * 4;
		pixels[loc] = 255;
		pixels[loc + 1] = 255;
		pixels[loc + 2] = 255;
	}

	currentX = 0;
	currentY = 0;
	currentZ = 0;

	path = [];
	donePositions = [];

	for (var x = 0; x < canvasWidth; x++) {
		donePositions[x] = []
		for (var y = 0; y < canvasHeight; y++) {
			donePositions[x][y] = false;
		}
	}

	// absolute
	gCode = "G90" + newline;
	// work in mm
	gCode += "G21" + newline;

	for (var y = 0; y < canvasHeight; y++) {
		for (var x = 0; x < canvasWidth; x++) {
			if (donePositions[x][y] == false) {
				var loc = (x + y * canvasWidth) * 4;
				var color = pixels[loc];
				if (color < 255) {
					cutShape(x, y);
				}
				else {
					donePositions[x][y] = true;
				}
			}
		}
	}

	gCode += raiseBit();
	gCode += fastMove(0, 0);
	gCode += "M18"

	return gCode;
}

function checkPixel(i, j) {
	if (i >= 0 && i < canvasWidth && j >= 0 && j < canvasHeight) {
		var loc = (i + j * canvasWidth) * 4;
		var color = pixels[loc];
		if (color == 255) {
			return true;
		}
	}
	return false;
}

function cutShape(x, y) {
	var isSingle = true;
	for (var i = x - 1; i <= x + 1; i++) {
		for (var j = y - 1; j <= y + 1; j++) {
			if (i != x && j != y && (i >= 0 && i < canvasWidth && j >= 0 && j < canvasHeight)) {
				var loc = (i + j * canvasWidth) * 4;
				var color = pixels[loc];
				if (donePositions[i][j] == false && color < 255) {
					isSingle = false;
					break;
				}
			}
		}
	}

	if (isSingle) {
		donePositions[x][y] = true;
		return;
	}

	gCode += newline;
	gCode += ";; CUTTING SHAPE" + newline;

	if (currentZ < moveHeight && (currentX != x || currentY != y)) {
		gCode += raiseBit();
	}

	if (currentX != x || currentY != y) {
		gCode += fastMove(x, y);
		currentX = x;
		currentY = y;
	}

	currentZ = 0;
	layer = [];

	layer.push({ X: x, Y: y, Dir: "R" });
	path.push({ X: x, Y: y });
	markDone(x, y);

	var next = findNext(x, y, "R");
	while (next != undefined) {
		layer.push({ X: next.X, Y: next.Y, Dir: next.Dir });
		path.push({ X: next.X, Y: next.Y });
		markDone(next.X, next.Y);

		next = findNext(next.X, next.Y, next.Dir);
	}

	while (currentZ > -maxCutDepth) {
		currentZ -= cutDepth;

		gCode += ";; CUTTING LAYER: " + currentZ + newline;
		gCode += plunge(currentZ);

		for (var i = 0; i < layer.length; i++) {
			var pos = layer[i];
			cutPosition(pos.X, pos.Y);
		}
	}

	gCode += raiseBit();
}

function calcNext(x, y, dir) {
	if (dir == "R") {
		return { X: x + offset, Y: y };
	} else if (dir == "BR") {
		return { X: x + offset, Y: y + offset };
	} else if (dir == "B") {
		return { X: x, Y: y + offset };
	} else if (dir == "BL") {
		return { X: x - offset, Y: y + offset };
	} else if (dir == "L") {
		return { X: x - offset, Y: y };
	} else if (dir == "TL") {
		return { X: x - offset, Y: y - offset };
	} else if (dir == "T") {
		return { X: x, Y: y - offset };
	} else if (dir == "TR") {
		return { X: x + offset, Y: y - offset };
	}
}

function markDone(x, y) {
	donePositions[x][y] = true;
}

function findNext(x, y, dir) {
	if (dir == "R") {
		//top right
		var hasNext = doesHaveNext(x + 1, y - 1, "TR");
		if (hasNext) {
			return { X: x + 1, Y: y - 1, Dir: "TR" };
		}
		//right
		var hasNext = doesHaveNext(x + 1, y, "R");
		if (hasNext) {
			return { X: x + 1, Y: y, Dir: "R" };
		}
		//bottom right
		var hasNext = doesHaveNext(x + 1, y + 1, "BR");
		if (hasNext) {
			return { X: x + 1, Y: y + 1, Dir: "BR" };
		}
		//bottom
		var hasNext = doesHaveNext(x, y + 1, "B");
		if (hasNext) {
			return { X: x, Y: y + 1, Dir: "B" };
		}
		//bottom left
		var hasNext = doesHaveNext(x - 1, y + 1, "BL");
		if (hasNext) {
			return { X: x - 1, Y: y + 1, Dir: "BL" };
		}
		//left
		var hasNext = doesHaveNext(x - 1, y, "L");
		if (hasNext) {
			return { X: x - 1, Y: y, Dir: "L" };
		}
		//top left
		var hasNext = doesHaveNext(x - 1, y - 1, "TL");
		if (hasNext) {
			return { X: x - 1, Y: y - 1, Dir: "TL" };
		}
		//top
		var hasNext = doesHaveNext(x, y - 1, "T");
		if (hasNext) {
			return { X: x, Y: y - 1, Dir: "T" };
		}
	} else if (dir == "BR") {
		//right
		var hasNext = doesHaveNext(x + 1, y, "R");
		if (hasNext) {
			return { X: x + 1, Y: y, Dir: "R" };
		}
		//bottom right
		var hasNext = doesHaveNext(x + 1, y + 1, "BR");
		if (hasNext) {
			return { X: x + 1, Y: y + 1, Dir: "BR" };
		}
		//bottom
		var hasNext = doesHaveNext(x, y + 1, "B");
		if (hasNext) {
			return { X: x, Y: y + 1, Dir: "B" };
		}
		//bottom left
		var hasNext = doesHaveNext(x - 1, y + 1, "BL");
		if (hasNext) {
			return { X: x - 1, Y: y + 1, Dir: "BL" };
		}
		//left
		var hasNext = doesHaveNext(x - 1, y, "L");
		if (hasNext) {
			return { X: x - 1, Y: y, Dir: "L" };
		}
		//top left
		var hasNext = doesHaveNext(x - 1, y - 1, "TL");
		if (hasNext) {
			return { X: x - 1, Y: y - 1, Dir: "TL" };
		}
		//top
		var hasNext = doesHaveNext(x, y - 1, "T");
		if (hasNext) {
			return { X: x, Y: y - 1, Dir: "T" };
		}
		//top right
		var hasNext = doesHaveNext(x + 1, y - 1, "TR");
		if (hasNext) {
			return { X: x + 1, Y: y - 1, Dir: "TR" };
		}
	} else if (dir == "B") {
		//bottom right
		var hasNext = doesHaveNext(x + 1, y + 1, "BR");
		if (hasNext) {
			return { X: x + 1, Y: y + 1, Dir: "BR" };
		}
		//bottom
		var hasNext = doesHaveNext(x, y + 1, "B");
		if (hasNext) {
			return { X: x, Y: y + 1, Dir: "B" };
		}
		//bottom left
		var hasNext = doesHaveNext(x - 1, y + 1, "BL");
		if (hasNext) {
			return { X: x - 1, Y: y + 1, Dir: "BL" };
		}
		//left
		var hasNext = doesHaveNext(x - 1, y, "L");
		if (hasNext) {
			return { X: x - 1, Y: y, Dir: "L" };
		}
		//top left
		var hasNext = doesHaveNext(x - 1, y - 1, "TL");
		if (hasNext) {
			return { X: x - 1, Y: y - 1, Dir: "TL" };
		}
		//top
		var hasNext = doesHaveNext(x, y - 1, "T");
		if (hasNext) {
			return { X: x, Y: y - 1, Dir: "T" };
		}
		//top right
		var hasNext = doesHaveNext(x + 1, y - 1, "TR");
		if (hasNext) {
			return { X: x + 1, Y: y - 1, Dir: "TR" };
		}
		//right
		var hasNext = doesHaveNext(x + 1, y, "R");
		if (hasNext) {
			return { X: x + 1, Y: y, Dir: "R" };
		}
	} else if (dir == "BL") {
		//bottom
		var hasNext = doesHaveNext(x, y + 1, "B");
		if (hasNext) {
			return { X: x, Y: y + 1, Dir: "B" };
		}
		//bottom left
		var hasNext = doesHaveNext(x - 1, y + 1, "BL");
		if (hasNext) {
			return { X: x - 1, Y: y + 1, Dir: "BL" };
		}
		//left
		var hasNext = doesHaveNext(x - 1, y, "L");
		if (hasNext) {
			return { X: x - 1, Y: y, Dir: "L" };
		}
		//top left
		var hasNext = doesHaveNext(x - 1, y - 1, "TL");
		if (hasNext) {
			return { X: x - 1, Y: y - 1, Dir: "TL" };
		}
		//top
		var hasNext = doesHaveNext(x, y - 1, "T");
		if (hasNext) {
			return { X: x, Y: y - 1, Dir: "T" };
		}
		//top right
		var hasNext = doesHaveNext(x + 1, y - 1, "TR");
		if (hasNext) {
			return { X: x + 1, Y: y - 1, Dir: "TR" };
		}
		//right
		var hasNext = doesHaveNext(x + 1, y, "R");
		if (hasNext) {
			return { X: x + 1, Y: y, Dir: "R" };
		}
		//bottom right
		var hasNext = doesHaveNext(x + 1, y + 1, "BR");
		if (hasNext) {
			return { X: x + 1, Y: y + 1, Dir: "BR" };
		}
	} else if (dir == "L") {
		//bottom left
		var hasNext = doesHaveNext(x - 1, y + 1, "BL");
		if (hasNext) {
			return { X: x - 1, Y: y + 1, Dir: "BL" };
		}
		//left
		var hasNext = doesHaveNext(x - 1, y, "L");
		if (hasNext) {
			return { X: x - 1, Y: y, Dir: "L" };
		}
		//top left
		var hasNext = doesHaveNext(x - 1, y - 1, "TL");
		if (hasNext) {
			return { X: x - 1, Y: y - 1, Dir: "TL" };
		}
		//top
		var hasNext = doesHaveNext(x, y - 1, "T");
		if (hasNext) {
			return { X: x, Y: y - 1, Dir: "T" };
		}
		//top right
		var hasNext = doesHaveNext(x + 1, y - 1, "TR");
		if (hasNext) {
			return { X: x + 1, Y: y - 1, Dir: "TR" };
		}
		//right
		var hasNext = doesHaveNext(x + 1, y, "R");
		if (hasNext) {
			return { X: x + 1, Y: y, Dir: "R" };
		}
		//bottom right
		var hasNext = doesHaveNext(x + 1, y + 1, "BR");
		if (hasNext) {
			return { X: x + 1, Y: y + 1, Dir: "BR" };
		}
		//bottom
		var hasNext = doesHaveNext(x, y + 1, "B");
		if (hasNext) {
			return { X: x, Y: y + 1, Dir: "B" };
		}
	} else if (dir == "TL") {
		//left
		var hasNext = doesHaveNext(x - 1, y, "L");
		if (hasNext) {
			return { X: x - 1, Y: y, Dir: "L" };
		}
		//top left
		var hasNext = doesHaveNext(x - 1, y - 1, "TL");
		if (hasNext) {
			return { X: x - 1, Y: y - 1, Dir: "TL" };
		}
		//top
		var hasNext = doesHaveNext(x, y - 1, "T");
		if (hasNext) {
			return { X: x, Y: y - 1, Dir: "T" };
		}
		//top right
		var hasNext = doesHaveNext(x + 1, y - 1, "TR");
		if (hasNext) {
			return { X: x + 1, Y: y - 1, Dir: "TR" };
		}
		//right
		var hasNext = doesHaveNext(x + 1, y, "R");
		if (hasNext) {
			return { X: x + 1, Y: y, Dir: "R" };
		}
		//bottom right
		var hasNext = doesHaveNext(x + 1, y + 1, "BR");
		if (hasNext) {
			return { X: x + 1, Y: y + 1, Dir: "BR" };
		}
		//bottom
		var hasNext = doesHaveNext(x, y + 1, "B");
		if (hasNext) {
			return { X: x, Y: y + 1, Dir: "B" };
		}
		//bottom left
		var hasNext = doesHaveNext(x - 1, y + 1, "BL");
		if (hasNext) {
			return { X: x - 1, Y: y + 1, Dir: "BL" };
		}
	} else if (dir == "T") {
		//top left
		var hasNext = doesHaveNext(x - 1, y - 1, "TL");
		if (hasNext) {
			return { X: x - 1, Y: y - 1, Dir: "TL" };
		}
		//top
		var hasNext = doesHaveNext(x, y - 1, "T");
		if (hasNext) {
			return { X: x, Y: y - 1, Dir: "T" };
		}
		//top right
		var hasNext = doesHaveNext(x + 1, y - 1, "TR");
		if (hasNext) {
			return { X: x + 1, Y: y - 1, Dir: "TR" };
		}
		//right
		var hasNext = doesHaveNext(x + 1, y, "R");
		if (hasNext) {
			return { X: x + 1, Y: y, Dir: "R" };
		}
		//bottom right
		var hasNext = doesHaveNext(x + 1, y + 1, "BR");
		if (hasNext) {
			return { X: x + 1, Y: y + 1, Dir: "BR" };
		}
		//bottom
		var hasNext = doesHaveNext(x, y + 1, "B");
		if (hasNext) {
			return { X: x, Y: y + 1, Dir: "B" };
		}
		//bottom left
		var hasNext = doesHaveNext(x - 1, y + 1, "BL");
		if (hasNext) {
			return { X: x - 1, Y: y + 1, Dir: "BL" };
		}
		//left
		var hasNext = doesHaveNext(x - 1, y, "L");
		if (hasNext) {
			return { X: x - 1, Y: y, Dir: "L" };
		}
	} else if (dir == "TR") {
		//top
		var hasNext = doesHaveNext(x, y - 1, "T");
		if (hasNext) {
			return { X: x, Y: y - 1, Dir: "T" };
		}
		//top right
		var hasNext = doesHaveNext(x + 1, y - 1, "TR");
		if (hasNext) {
			return { X: x + 1, Y: y - 1, Dir: "TR" };
		}
		//right
		var hasNext = doesHaveNext(x + 1, y, "R");
		if (hasNext) {
			return { X: x + 1, Y: y, Dir: "R" };
		}
		//bottom right
		var hasNext = doesHaveNext(x + 1, y + 1, "BR");
		if (hasNext) {
			return { X: x + 1, Y: y + 1, Dir: "BR" };
		}
		//bottom
		var hasNext = doesHaveNext(x, y + 1, "B");
		if (hasNext) {
			return { X: x, Y: y + 1, Dir: "B" };
		}
		//bottom left
		var hasNext = doesHaveNext(x - 1, y + 1, "BL");
		if (hasNext) {
			return { X: x - 1, Y: y + 1, Dir: "BL" };
		}
		//left
		var hasNext = doesHaveNext(x - 1, y, "L");
		if (hasNext) {
			return { X: x - 1, Y: y, Dir: "L" };
		}
		//top left
		var hasNext = doesHaveNext(x - 1, y - 1, "TL");
		if (hasNext) {
			return { X: x - 1, Y: y - 1, Dir: "TL" };
		}
	}
	return undefined;
}

function cutPosition(x, y) {
	if (currentX != x || currentY != y) {
		gCode += slowMove(x, y);

		currentX = x;
		currentY = y;
	}
}

function doesHaveNext(x, y, dir) {
	if (x >= 0 && y >= 0 && x < canvasWidth && y < canvasHeight) {
		if (donePositions[x][y] == false) {
			var loc = (x + y * canvasWidth) * 4;
			var color = pixels[loc];
			return color < 255;
		}
	}
	return false;
}

function raiseBit() {
	return "G1 Z" + moveHeight + " F" + plungeRate + " " + newline;
}

function plunge(depth) {
	return "G1 Z" + depth + " F" + plungeRate + " " + newline;
}

function fastMove(x, y) {
	return "G0 " + move(x, y) + " F" + moveRate + " " + newline;
}

function slowMove(x, y) {
	return "G1 " + move(x, y) + " F" + cutRate + " " + newline;
}

function move(x, y) {
	return "X" + (x / slabScale) + " Y" + (y / slabScale);
}