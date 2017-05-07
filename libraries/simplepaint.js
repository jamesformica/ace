/// <reference path="../types/jquery.d.ts" />
var simplepaint;
(function (simplepaint) {
    "use strict";
    var CanvasManager = (function () {
        function CanvasManager($container, options) {
            this.$container = $container;
            this.options = options;
            this.buildSimplePaint();
            this.setOptions();
            this.attachEvents();
            this.buildStrokeOptions();
            this.buildColourOptions();
            this.drawingManager = new simplepaint.DrawingManager(this.$canvas.get(0));
            this.setMiddleStroke();
            this.setRandomColour();
        }
        CanvasManager.prototype.getImage = function () {
            return this.drawingManager.getImage();
        };
        CanvasManager.prototype.clearCanvas = function () {
            this.drawingManager.startAgain();
        };
        CanvasManager.prototype.attachEvents = function () {
            var _this = this;
            var $brush = this.$menu.find(".ui-brush");
            var $erase = this.$menu.find(".ui-eraser");
            var $fill = this.$menu.find(".ui-fill");
            var $stroke = this.$menu.find(".ui-show-stroke");
            $brush.click(function () {
                _this.drawingManager.toggleEraseMode(false);
                _this.drawingManager.toggleFillMode(false);
                _this.selectTool($brush);
            });
            $erase.click(function () {
                _this.drawingManager.toggleEraseMode(true);
                _this.drawingManager.toggleFillMode(false);
                _this.selectTool($erase);
            });
            $fill.click(function () {
                _this.drawingManager.toggleEraseMode(false);
                _this.drawingManager.toggleFillMode(true);
                _this.selectTool($fill);
            });
            $stroke.click(function () {
                _this.$colourContainer.removeClass("open");
                _this.$strokeContainer.toggleClass("open");
            });
            this.$menu.find(".ui-show-colour").click(function () {
                _this.$strokeContainer.removeClass("open");
                _this.$colourContainer.toggleClass("open");
            });
            this.$menu.find(".ui-clear").click(function () {
                _this.drawingManager.startAgain();
                $brush.click();
            });
            this.$strokeContainer.on("click", ".ui-stroke-option", function (e) {
                _this.selectStroke($(e.currentTarget));
            });
            this.$colourContainer.on("click", ".ui-colour-option", function (e) {
                var $colour = $(e.currentTarget);
                _this.selectColour($colour.data("colour"));
                _this.$colourContainer.removeClass("open");
                _this.$colourContainer.find(".selected").removeClass("selected");
                $colour.addClass("selected");
            });
            this.$canvas.mousedown(function () {
                _this.$strokeContainer.removeClass("open");
                _this.$colourContainer.removeClass("open");
            });
        };
        CanvasManager.prototype.selectTool = function ($tool) {
            this.$strokeContainer.removeClass("open");
            this.$colourContainer.removeClass("open");
            if (!$tool.hasClass("selected")) {
                var $currentSelected = $tool.parent().find(".ui-menu-item-container.selected");
                $currentSelected.removeClass("selected");
                $tool.addClass("selected");
            }
        };
        CanvasManager.prototype.selectStroke = function ($stroke) {
            this.drawingManager.setStroke($stroke.data("stroke"));
            this.$strokeContainer.removeClass("open");
            this.$strokeContainer.find(".selected").removeClass("selected");
            $stroke.addClass("selected");
        };
        CanvasManager.prototype.selectColour = function (colour) {
            this.drawingManager.setColour(colour);
            this.$colourMenuItem.find("i").css("background-color", colour);
        };
        CanvasManager.prototype.setOptions = function () {
            var optionsSet = this.isNotNullOrUndefined(this.options);
            if (optionsSet && this.isNotNullOrUndefined(this.options.colours)) {
                this.colours = this.options.colours;
            }
            else {
                var reds = ["#B71C1C", "#D32F2F", "#F44336", "#E57373"];
                var purples = ["#4A148C", "#7B1FA2", "#9C27B0", "#BA68C8"];
                var blues = ["#0D47A1", "#1976D2", "#2196F3", "#64B5F6"];
                var teals = ["#004D40", "#00796B", "#009688", "#4DB6AC"];
                var greens = ["#1B5E20", "#388E3C", "#4CAF50", "#81C784"];
                var yellows = ["#F57F17", "#FBC02D", "#FFEB3B", "#FFF176"];
                var oranges = ["#E65100", "#F57C00", "#FF9800", "#FFB74D"];
                var shades = ["#000000", "#616161", "#9E9E9E", "#ffffff"];
                this.colours = reds.concat(purples).concat(blues).concat(teals).concat(greens).concat(yellows).concat(oranges).concat(shades);
            }
            if (optionsSet && this.isNotNullOrUndefined(this.options.brushSizes)) {
                this.brushSizes = this.options.brushSizes;
            }
            else {
                this.brushSizes = [4, 8, 12, 16, 20, 24, 28, 32, 36, 42, 48, 54, 60];
            }
            if (optionsSet && this.isNotNullOrUndefined(this.options.height)) {
                this.$canvas.attr("height", this.options.height);
            }
            else {
                this.$canvas.attr("height", 400); // chosen randomly by fair dice roll * 100
            }
            var canvasWidth = this.$canvas.width();
            this.$canvas.attr("width", canvasWidth);
        };
        CanvasManager.prototype.setRandomColour = function () {
            var chosenColour;
            var $chosenColour;
            var $allColours = this.$colourContainer.find(".ui-colour-option");
            do {
                $chosenColour = $($allColours[Math.floor(Math.random() * this.colours.length)]);
                chosenColour = $chosenColour.data("colour");
            } while (chosenColour.toLowerCase() === "#ffffff" || chosenColour.toLowerCase() === "white");
            $chosenColour.click();
        };
        CanvasManager.prototype.setMiddleStroke = function () {
            var $allStrokes = this.$strokeContainer.find(".ui-stroke-option");
            var $centerStroke = $($allStrokes[Math.floor($allStrokes.length / 2)]);
            this.selectStroke($centerStroke);
        };
        CanvasManager.prototype.isNotNullOrUndefined = function (value) {
            return value !== undefined && value !== null;
        };
        CanvasManager.prototype.buildSimplePaint = function () {
            var $b_simplePaint = $("<div class=\"simplepaint\"></div>");
            var $b_menu = $("<div class=\"menu\"></div>");
            var $b_brushOption = $("<i class=\"icon-brush\" title=\"Brush\"></i>");
            var $b_eraser = $("<i class=\"icon-eraser\" title=\"Eraser\"></i>");
            var $b_fill = $("<i class=\"icon-bucket\" title=\"Fill\"></i>");
            var $b_colourOption = $("<i class=\"colour\" title=\"Colour\"></i>");
            var $b_sizeOption = $("<i class=\"icon-radio-unchecked\" title=\"Stroke\"></i>");
            var $b_startAgainOption = $("<i class=\"icon-bin bottom\" title=\"Start Again\"></i>");
            var $b_strokeContainer = $("<div class=\"slider\"></div>");
            var $b_strokeContainerTitle = $("<p><i class=\"icon-brush\"></i>Select a brush size</p>");
            var $b_colourContainer = $("<div class=\"slider\"></div>");
            var $b_colourContainerTitle = $("<p><i class=\"icon-palette\"></i> Select a colour</p>");
            var $b_canvas = $("<canvas></canvas>");
            $b_strokeContainer.append($b_strokeContainerTitle);
            $b_colourContainer.append($b_colourContainerTitle);
            var $simplePaintContainer = $b_simplePaint.appendTo(this.$container);
            this.$menu = $b_menu.appendTo($simplePaintContainer);
            this.$strokeContainer = $b_strokeContainer.appendTo($simplePaintContainer);
            this.$colourContainer = $b_colourContainer.appendTo($simplePaintContainer);
            this.$canvas = $b_canvas.appendTo($simplePaintContainer);
            var menuItems = [
                this.wrapMenuItem($b_brushOption, "ui-brush selected"),
                this.wrapMenuItem($b_eraser, "ui-eraser")
            ];
            if (this.canFill()) {
                menuItems.push(this.wrapMenuItem($b_fill, "ui-fill"));
            }
            menuItems.push(this.wrapMenuItem($b_sizeOption, "ui-show-stroke"));
            menuItems.push(this.wrapMenuItem($b_colourOption, "ui-show-colour"));
            menuItems.push(this.wrapMenuItem($b_startAgainOption, "ui-clear bottom"));
            $b_menu.append(menuItems);
            this.$colourMenuItem = this.$menu.find(".ui-show-colour");
        };
        CanvasManager.prototype.wrapMenuItem = function ($item, cssClasses) {
            return $("<div></div>")
                .addClass("menu-item-container ui-menu-item-container")
                .addClass(cssClasses)
                .append($item);
        };
        CanvasManager.prototype.buildStrokeOptions = function () {
            for (var i = 0; i < this.brushSizes.length; i++) {
                var $option = $("<i class='icon-radio-unchecked' style='font-size: " + this.brushSizes[i] + "px'></i>");
                var $size = $("<span class='size'>" + this.brushSizes[i] + "</span>");
                $option.append($size);
                var $optionWrapper = $("<div></div>")
                    .addClass("option-wrapper ui-stroke-option")
                    .data("stroke", this.brushSizes[i])
                    .append($option);
                this.$strokeContainer.append($optionWrapper);
            }
        };
        CanvasManager.prototype.buildColourOptions = function () {
            for (var i = 0; i < this.colours.length; i++) {
                var $option = $("<span style='background: " + this.colours[i] + "'></i>")
                    .addClass("option-wrapper ui-colour-option")
                    .data("colour", this.colours[i]);
                this.$colourContainer.append($option);
            }
        };
        CanvasManager.prototype.canFill = function () {
            var canvas = this.$canvas.get(0);
            var context = canvas.getContext("2d");
            // Test for cross origin security error (SECURITY_ERR: DOM Exception 18)
            try {
                var outlineLayerData = context.getImageData(0, 0, canvas.width, canvas.height);
            }
            catch (ex) {
                return false;
            }
            return true;
        };
        return CanvasManager;
    }());
    simplepaint.CanvasManager = CanvasManager;
})(simplepaint || (simplepaint = {}));
var simplepaint;
(function (simplepaint) {
    var helper;
    (function (helper) {
        "use strict";
        function floodFill(stage, canvas, colour) {
            var pixelStack = [[stage.mouseX, stage.mouseY]];
            var context = canvas.getContext("2d");
            var colourLayerData = context.getImageData(0, 0, canvas.width, canvas.height);
            var clickPixel = Math.floor((stage.mouseY * canvas.width + stage.mouseX) * 4);
            var rgbaClickColour = getClickRgbaColour(colourLayerData, clickPixel);
            var rgbaFillColour = getFillRgbaColour(colour);
            if (areColoursTheSame(rgbaClickColour, rgbaFillColour)) {
                return;
            }
            while (pixelStack.length) {
                var x = void 0;
                var y = void 0;
                var newPos = void 0;
                var pixelPos = void 0;
                var reachLeft = void 0;
                var reachRight = void 0;
                newPos = pixelStack.pop();
                x = Math.floor(newPos[0]);
                y = Math.floor(newPos[1]);
                pixelPos = Math.floor((y * canvas.width + x) * 4);
                while (y-- >= 0 && doesPixelMatchClickColour(pixelPos, colourLayerData, rgbaClickColour, rgbaFillColour)) {
                    pixelPos -= canvas.width * 4;
                }
                pixelPos += canvas.width * 4;
                ++y;
                reachLeft = false;
                reachRight = false;
                while (y++ < canvas.height - 1 && doesPixelMatchClickColour(pixelPos, colourLayerData, rgbaClickColour, rgbaFillColour)) {
                    colorPixel(pixelPos, colourLayerData, rgbaFillColour);
                    if (x > 0) {
                        if (doesPixelMatchClickColour(pixelPos - 4, colourLayerData, rgbaClickColour, rgbaFillColour)) {
                            if (!reachLeft) {
                                pixelStack.push([x - 1, y]);
                                reachLeft = true;
                            }
                        }
                        else if (reachLeft) {
                            reachLeft = false;
                        }
                    }
                    if (x < canvas.width - 1) {
                        if (doesPixelMatchClickColour(pixelPos + 4, colourLayerData, rgbaClickColour, rgbaFillColour)) {
                            if (!reachRight) {
                                pixelStack.push([x + 1, y]);
                                reachRight = true;
                            }
                        }
                        else if (reachRight) {
                            reachRight = false;
                        }
                    }
                    pixelPos += canvas.width * 4;
                }
            }
            context.putImageData(colourLayerData, 0, 0);
        }
        helper.floodFill = floodFill;
        function getClickRgbaColour(colourLayerData, clickPixel) {
            return {
                r: colourLayerData.data[clickPixel],
                g: colourLayerData.data[clickPixel + 1],
                b: colourLayerData.data[clickPixel + 2],
                a: colourLayerData.data[clickPixel + 3]
            };
        }
        function areColoursTheSame(colour1, colour2) {
            return colour1.r === colour2.r && colour1.g === colour2.g && colour1.b === colour2.b && colour1.a === colour2.a;
        }
        function doesPixelMatchClickColour(pixelPos, colorLayer, clickColour, fillColour) {
            var currentRgba = {
                r: colorLayer.data[pixelPos],
                g: colorLayer.data[pixelPos + 1],
                b: colorLayer.data[pixelPos + 2],
                a: colorLayer.data[pixelPos + 3]
            };
            var clickMatches = areColoursTheSame(currentRgba, clickColour);
            if (!clickMatches && !areColoursTheSame(currentRgba, fillColour)) {
                var isRClose = fillColour.r - 16 <= currentRgba.r;
                var isGClose = fillColour.g - 16 <= currentRgba.g;
                var isBClose = fillColour.b - 16 <= currentRgba.b;
                if (isRClose && isGClose && isBClose) {
                    return true;
                }
            }
            return clickMatches;
        }
        function colorPixel(pixelPos, colorLayer, fillColour) {
            colorLayer.data[pixelPos] = fillColour.r;
            colorLayer.data[pixelPos + 1] = fillColour.g;
            colorLayer.data[pixelPos + 2] = fillColour.b;
            colorLayer.data[pixelPos + 3] = fillColour.a;
        }
        function getFillRgbaColour(colour) {
            var fakeDiv = document.createElement("div");
            fakeDiv.style.display = "none";
            fakeDiv.style.color = colour;
            var newChild = document.body.appendChild(fakeDiv);
            var rgbString = window.getComputedStyle(fakeDiv).color;
            document.body.removeChild(newChild);
            var rgbStringArray = rgbString.substring(4, rgbString.length - 1)
                .replace(/ /g, '')
                .split(',');
            var rgbNumberArray = rgbStringArray.map(function (a) {
                return Number(a);
            });
            var fillRgba = {
                r: 0,
                g: 0,
                b: 0,
                a: 255
            };
            if (rgbNumberArray.length >= 3) {
                fillRgba.r = rgbNumberArray[0];
                fillRgba.g = rgbNumberArray[1];
                fillRgba.b = rgbNumberArray[2];
            }
            if (rgbNumberArray.length === 4) {
                fillRgba.a = rgbNumberArray[3];
            }
            return fillRgba;
        }
    })(helper = simplepaint.helper || (simplepaint.helper = {}));
})(simplepaint || (simplepaint = {}));
/// <reference path="../types/easeljs.d.ts" />
var simplepaint;
(function (simplepaint) {
    var DrawingManager = (function () {
        function DrawingManager(canvas) {
            this.canvas = canvas;
            this.index = 0;
            this.stroke = 0;
            this.isFillMode = false;
            this.isErasing = false;
            //check to see if we are running in a browser with touch support
            this.stage = new createjs.Stage(canvas);
            this.stage.autoClear = false;
            this.stage.enableDOMEvents(true);
            this.shapeLayer = new createjs.Shape();
            this.stage.addChild(this.shapeLayer);
            createjs.Touch.enable(this.stage);
            createjs.Ticker.setFPS(24);
            this.attachMouseDown(this);
            this.attachMouseUp(this);
            this.stage.update();
        }
        DrawingManager.prototype.setStroke = function (stroke) {
            this.stroke = stroke;
        };
        DrawingManager.prototype.setColour = function (colour) {
            this.color = colour;
        };
        DrawingManager.prototype.toggleFillMode = function (isFillMode) {
            this.isFillMode = isFillMode;
        };
        DrawingManager.prototype.toggleEraseMode = function (isErasing) {
            this.isErasing = isErasing;
        };
        DrawingManager.prototype.startAgain = function () {
            this.stage.clear();
        };
        DrawingManager.prototype.getImage = function () {
            var bitmap = new createjs.Bitmap(this.canvas);
            bitmap.cache(0, 0, this.canvas.width, this.canvas.height, 1);
            var base64 = bitmap.getCacheDataURL();
            return base64;
        };
        DrawingManager.prototype.attachMouseDown = function (manager) {
            manager.stage.addEventListener("stagemousedown", function (event) {
                if (manager.isFillMode) {
                    manager.floodFill();
                }
                else {
                    manager.handleMouseDown(event);
                }
            });
        };
        DrawingManager.prototype.attachMouseUp = function (manager) {
            manager.stage.addEventListener("stagemouseup", function (event) {
                manager.handleMouseUp(event);
            });
        };
        DrawingManager.prototype.attachMouseMove = function (manager) {
            manager.mouseMoveEvent = function (event) {
                manager.handleMouseMove(event);
            };
            manager.stage.addEventListener("stagemousemove", manager.mouseMoveEvent);
        };
        DrawingManager.prototype.removeMouseMove = function (manager) {
            manager.stage.removeEventListener("stagemousemove", manager.mouseMoveEvent);
        };
        DrawingManager.prototype.handleMouseDown = function (event) {
            if (!event.primary) {
                return;
            }
            this.oldPoint = new createjs.Point(this.stage.mouseX, this.stage.mouseY);
            this.oldMidPoint = this.oldPoint.clone();
            this.shapeLayer.graphics.clear()
                .beginStroke(this.color)
                .beginFill(this.color)
                .drawCircle(this.oldPoint.x, this.oldPoint.y, this.stroke / 2);
            this.shapeLayer.compositeOperation = this.isErasing ? "destination-out" : "source-over";
            this.stage.update();
            this.attachMouseMove(this);
        };
        DrawingManager.prototype.handleMouseMove = function (event) {
            if (!event.primary) {
                return;
            }
            var newMidPoint = new createjs.Point(this.oldPoint.x + this.stage.mouseX >> 1, this.oldPoint.y + this.stage.mouseY >> 1);
            this.shapeLayer.graphics.clear()
                .setStrokeStyle(this.stroke, 'round', 'round')
                .beginStroke(this.color)
                .moveTo(newMidPoint.x, newMidPoint.y)
                .curveTo(this.oldPoint.x, this.oldPoint.y, this.oldMidPoint.x, this.oldMidPoint.y);
            this.oldPoint.x = this.stage.mouseX;
            this.oldPoint.y = this.stage.mouseY;
            this.oldMidPoint.x = newMidPoint.x;
            this.oldMidPoint.y = newMidPoint.y;
            this.stage.update();
        };
        DrawingManager.prototype.handleMouseUp = function (event) {
            if (!event.primary) {
                return;
            }
            this.removeMouseMove(this);
        };
        DrawingManager.prototype.floodFill = function () {
            simplepaint.helper.floodFill(this.stage, this.canvas, this.color);
        };
        return DrawingManager;
    }());
    simplepaint.DrawingManager = DrawingManager;
})(simplepaint || (simplepaint = {}));
