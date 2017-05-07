var _previewCanvas;
var _topText;
var _bottomText;
var paneWidth;
var canvasManager;
var currentImage;

var SLAB_SCALE = 10;
var SELECTED_WIDTH = -1;
var SELECTED_HEIGHT = -1;

function initSlider() {
    _previewCanvas = document.getElementById("preview-canvas");
    _topText = document.getElementById("top-text");
    _bottomText = document.getElementById("bottom-text");

    var _productionLine = document.getElementById("production-line");
    var _productionSlider = document.getElementById("production-slider");
    var _slides = document.getElementsByClassName("slide");
    var _slideNextButtons = document.getElementsByClassName("slide-next");
    var _slidePrevButtons = document.getElementsByClassName("slide-prev");

    var slideIndex = 0;
    paneWidth = _productionLine.clientWidth;

    // set slides to width of _productionLine
    for (var i = 0; i < _slides.length; i++) {
        _slides[i].style.width = "" + paneWidth + "px";
    }

    // set production slider width to (_productionLine width * count of _slides)
    _productionSlider.style.width = "" + (paneWidth * _slides.length) + "px";

    // add click event for slider next buttons
    for (var i = 0; i < _slideNextButtons.length; i++) {
        _slideNextButtons[i].addEventListener("click", function (e) {
            var allGood = true;
            var _button = e.currentTarget;
            var _slide = _button.closest(".slide");
            var func = window[_slide.dataset.onleave];

            if (func && typeof func == "function") {
                allGood = func();
            }

            if (allGood) {
                if (slideIndex < _slides.length - 1) {
                    slideIndex++;
                    _productionSlider.style.transform = "translateX(" + (slideIndex * paneWidth) * -1 + "px)";

                } else {
                    finish();
                }
            }
        });
    }

    // add click event for slider prev buttons
    for (var i = 0; i < _slidePrevButtons.length; i++) {
        _slidePrevButtons[i].addEventListener("click", function (e) {
            if (slideIndex > 0) {
                slideIndex--;
                _productionSlider.style.transform = "translateX(" + (slideIndex * paneWidth) * -1 + "px)";
            }
        });
    }

    // add event listener for top & bottom text inputs
    _topText.onkeyup = function () {
        redrawCanvas(_topText.value, _bottomText.value);
    };

    _bottomText.onkeyup = function () {
        redrawCanvas(_topText.value, _bottomText.value);
    };

    // close event on output
    document.getElementById("close-output").addEventListener("click", function () {
        document.getElementById("output").classList.remove("show");
    });


    var _fileUploader = document.getElementById("image-upload");
    _fileUploader.onchange = function () {
        var file = _fileUploader.files[0];

        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            currentImage = reader.result;
        };

    };
}

function validateSize() {
    var _printWidth = document.getElementById("print-width");
    var _printHeight = document.getElementById("print-height");

    var printWidth = parseInt(_printWidth.value);
    var printHeight = parseInt(_printHeight.value);

    if (printWidth > 0 && printHeight > 0) {
        SELECTED_WIDTH = printWidth;
        SELECTED_HEIGHT = printHeight;

        setCanvasSize();
        return true;
    }

    alert("Values must be above 0");

    return false;
}

function setCanvasSize() {
    var _canvas = document.getElementById("sketch-canvas");

    // empty the canvas div
    while (_canvas.firstChild) {
        _canvas.removeChild(_canvas.firstChild);
    }

    var ratio = SELECTED_HEIGHT / SELECTED_WIDTH;

    var canvasWidth = paneWidth;
    var canvasHeight = canvasWidth * ratio;

    _canvas.width = canvasWidth;
    _canvas.height = canvasHeight;

    _previewCanvas.width = canvasWidth - 40;
    _previewCanvas.height = canvasHeight - 40;

    var $canvas = $(_canvas);
    var options = {
        colours: ["#000000"],
        brushSizes: [10],
        height: canvasHeight
    };

    currentImage = null;
    canvasManager = new simplepaint.CanvasManager($canvas, options);
}

function leavingCanvas() {
    if (!currentImage) {
        currentImage = canvasManager.getImage();
    }
    redrawCanvas(_topText.value, _bottomText.value);

    return true;
}

function redrawCanvas(topText, bottomText) {
    // clear the canvas
    var context = _previewCanvas.getContext("2d");
    context.clearRect(0, 0, _previewCanvas.width, _previewCanvas.height);
    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, _previewCanvas.width, _previewCanvas.height);

    // add the image
    var sketchImage = new Image();
    sketchImage.src = currentImage;
    sketchImage.onload = function () {
        context.drawImage(sketchImage, 0, 0, _previewCanvas.width, _previewCanvas.height);

        // lets draw the text (yes it should be inside the image load)
        context.font = "30px Arial";
        context.fillStyle = "#000000";
        context.textAlign = "center";
        if (topText && topText.trim().length > 0) {
            context.fillText(topText.trim().toUpperCase(), _previewCanvas.width / 2, 30);
        }

        if (bottomText && bottomText.trim().length > 0) {
            context.fillText(bottomText.trim().toUpperCase(), _previewCanvas.width / 2, _previewCanvas.height - 10);
        }
    }
}

function setOptions() {
    var _bitWidth = document.getElementById("bit-width");
    var _cutDepth = document.getElementById("cut-depth");
    var _numberCuts = document.getElementById("number-cuts");

    bitWidth = parseInt(_bitWidth.value);
    cutDepth = parseInt(_cutDepth.value);
    maxCutDepth = parseInt(_numberCuts.value) * cutDepth;

    return true;
}

function finish() {
    var tempCanvas = document.createElement("canvas");
    var tempContext = tempCanvas.getContext("2d");

    var actualWidth = SELECTED_WIDTH * SLAB_SCALE;
    var actualHeight = SELECTED_HEIGHT * SLAB_SCALE;

    tempCanvas.width = actualWidth;
    tempCanvas.height = actualHeight;
    tempContext.drawImage(_previewCanvas, 0, 0, _previewCanvas.width, _previewCanvas.height, 0, 0, actualWidth, actualHeight);

    //document.body.appendChild(tempCanvas);

    var _output = document.getElementById("output");
    var gCode = getGCode(tempCanvas);

    document.getElementById("output-content").innerText = gCode;
    _output.classList.add("show");
}