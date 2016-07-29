'use strict';

/*
 * Factory for setting up a FabricJS drawing surface on a canvas.
 * Also sets up callbacks for PeerJS, so it can receive line data
 * and draw them accordingly.
 */

angular.module('drawinghandler', [])
.factory('drawingFactory', function (configFactory, $window, $state, $timeout, peerFactory) {
    // References to two of the canvasi
    var remoteCanvas = null;
    var localCanvas  = null;

    // Configuration object
    var config = configFactory.getValue('drawings');

    var canvasSize = {
        width:  $window.innerWidth *  config.size.width,
        height: $window.innerHeight * config.size.height
    };

    // Takes in a selector and an optionals object
    // Size of canvas has to be calculated at runtime
    var initFabricJS = function (canvasId, opts) {
        var fabricCanvas = new fabric.Canvas(canvasId, {
            isDrawingMode: true,
            renderOnAddRemove: false,
            selection: false,
            stateful: false,
            width: canvasSize.width,
            height: canvasSize.height
        });

        fabricCanvas.calcOffset();
        fabricCanvas.freeDrawingBrush.width = config.brushWidth;
        fabricCanvas.freeDrawingBrush.color = config.localColor;

        fabricCanvas.isArrowModeOn = false;
        fabricCanvas.isMouseCurrentlyPressed = false;

        fabricCanvas.toggleArrowDrawingMode = function () {
            this.isDrawingMode   = !this.isDrawingMode;
            this.isArrowModeOn   = !this.isArrowModeOn;
        };

        if (opts.isRemote === true) {
            remoteCanvas = fabricCanvas;
            fabricCanvas.tag = 'remote';
        } else if (opts.isRemote === false) {
            localCanvas = fabricCanvas;
            fabricCanvas.tag = 'local';
        }

        return fabricCanvas;
    };

    var setUpCanvasEvents = function (canvas) {
        canvas.on('path:created', function (e) {
            var data = angular.toJson(e.path);

            var dataToSend = {
                type                          : 'newPathCreated',
                tag                           : canvas.tag,
                data                          : data,
                remoteCanvasSize              : canvasSize
            };

            peerFactory.sendDataToPeer(angular.toJson(dataToSend));

            e.path.selectable = false;

        });

        canvas.on('mouse:down', function (e) {
            var pointer;
            var points;

            if (canvas.isArrowModeOn === true) {
                this.isMouseCurrentlyPressed = true;
                pointer = canvas.getPointer(e.e);
                points = [pointer.x, pointer.y, pointer.x, pointer.y];

                this.currentArrow = new fabric.Line(points, {
                    strokeWidth: config.arrows.strokeWidth,
                    fill: config.localColor,
                    stroke: config.localColor,
                    selectable: false,
                    originX: 'center',
                    originY: 'center'
                });

                this.currentArrow.startingX = pointer.x;
                this.currentArrow.startingY = pointer.y;

                this.currentArrowHead = new fabric.Triangle({
                    width: config.arrows.headWidth,
                    height: config.arrows.headHeight,
                    fill: config.localColor,
                    stroke: config.localColor,
                    selectable: false,
                    originX: 'center',
                    originY: 'center',
                    top: pointer.y,
                    left: pointer.x
                });

                canvas.add(this.currentArrow);
                canvas.add(this.currentArrowHead);
            }});

        canvas.on('mouse:move', function (e) {
            var pointer;

            var startingX;
            var startingY;

            var currentY;
            var currentX;

            var headAngle;

            if (this.isArrowModeOn === true) {
                if (!this.isMouseCurrentlyPressed) return;

                pointer = canvas.getPointer(e.e);

                startingX = this.currentArrow.startingX;
                startingY = this.currentArrow.startingY;

                currentY = pointer.y;
                currentX = pointer.x;

                headAngle = Math.atan2(currentY - startingY, currentX - startingX);
                headAngle *= 180 / Math.PI;
                headAngle += 90;

                this.currentArrow.set({ x2: pointer.x, y2: pointer.y });
                this.currentArrowHead.set({ left: pointer.x, top: pointer.y, angle: headAngle });
                canvas.renderAll();
            }
        });

        canvas.on('mouse:up', function () {
            var arrowData;
            var dataToSend;

            if (this.isArrowModeOn === true) {
                this.isMouseCurrentlyPressed = false;
                arrowData = { line: this.currentArrow, head: this.currentArrowHead };

                dataToSend = {
                    type                          : 'newArrowCreated',
                    tag                           : canvas.tag,
                    data                          : arrowData,
                    remoteCanvasSize              : canvasSize
                };

                peerFactory.sendDataToPeer(angular.toJson(dataToSend));
            }
        });
    };

    var addPathToCanvas = function (canvasTag, pathData, remoteCanvasSize) {
        if (canvasTag === 'local') {
            addNewPathToCanvas(remoteCanvas, pathData, remoteCanvasSize);
        } else if (canvasTag === 'remote') {
            addNewPathToCanvas(localCanvas, pathData, remoteCanvasSize);
        }
    };

    var addNewPathToCanvas = function (canvas, pathData, remoteCanvasSize) {
        pathData = angular.fromJson(pathData);
        fabric.util.enlivenObjects([pathData], function (objects) {
            objects.forEach(function (o) {
                o.stroke = config.remoteColor;

                o.set({
                    top:    o.top    / (remoteCanvasSize.height / canvasSize.height),
                    left:   o.left   / (remoteCanvasSize.width  / canvasSize.width),
                    scaleY: o.scaleX / (remoteCanvasSize.height / canvasSize.height),
                    scaleX: o.scaleY / (remoteCanvasSize.width  / canvasSize.width),
                    selectable: false
                });

                canvas.add(o);
                canvas.renderAll(true);
            });
        });
    };

    var addArrowToCanvas = function (canvasTag, arrowData, remoteCanvasSize) {
        if (canvasTag === 'local') {
            addNewArrowToCanvas(remoteCanvas, arrowData, remoteCanvasSize);
        } else if (canvasTag === 'remote') {
            addNewArrowToCanvas(localCanvas, arrowData, remoteCanvasSize);
        }
    };

    var addNewArrowToCanvas = function (canvas, arrowData, remoteCanvasSize) {
        fabric.util.enlivenObjects([arrowData.line, arrowData.head], function (objects) {
            objects.forEach(function (o) {
                o.stroke = config.remoteColor;
                o.fill = config.remoteColor;

                o.set({
                    top:    o.top    / (remoteCanvasSize.height / canvasSize.height),
                    left:   o.left   / (remoteCanvasSize.width  / canvasSize.width),
                    scaleY: o.scaleX / (remoteCanvasSize.height / canvasSize.height),
                    scaleX: o.scaleY / (remoteCanvasSize.width  / canvasSize.width)
                });

                canvas.add(o);
                canvas.renderAll(true);
            });
        });
    };

    var setUpDrawingCanvas = function (canvasId, opts) {
        var canvas = initFabricJS(canvasId, opts);
        setUpCanvasEvents(canvas);
    };

    var clearCanvas = function (canvas) {
        canvas.clear();
    };

    // Public API begins here
    return {
        setUpRemoteCanvas: function (canvasId, opts) {
            if (!remoteCanvas) {
                opts.isRemote = true;
                setUpDrawingCanvas(canvasId, opts);
            }
        },
        setUpLocalCanvas: function (canvasId, opts) {
            if (!localCanvas) {
                opts.isRemote = false;
                setUpDrawingCanvas(canvasId, opts);
            }
        },
        toggleArrowDrawingMode: function () {
            remoteCanvas.toggleArrowDrawingMode();
            localCanvas.toggleArrowDrawingMode();
        },
        setUpDataCallbacks: function () {
            peerFactory.registerCallback('newPathCreated', function (data) {
                var parsedData = angular.fromJson(data);
                addPathToCanvas(parsedData.tag, parsedData.data, parsedData.remoteCanvasSize);
            });

            peerFactory.registerCallback('newArrowCreated', function (data) {
                var parsedData = angular.fromJson(data);
                addArrowToCanvas(parsedData.tag, parsedData.data, parsedData.remoteCanvasSize);
            });
        },
        clearLocalCanvas: function () {
            clearCanvas(localCanvas);
        },
        clearRemoteCanvas: function () {
            clearCanvas(remoteCanvas);
        },
        tearDownDrawingFactory: function () {
            peerFactory.clearCallback('newPathCreated');
            peerFactory.clearCallback('newArrowCreated');
            remoteCanvas = null;
            localCanvas  = null;
        }
    };
});

