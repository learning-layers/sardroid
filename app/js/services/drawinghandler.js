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

    // Array that will eventually contain a bunch of angular $timeouts
    // We need to keep track of em so we can easily cancel them all if need be
    var pathRemoveTimers = [];

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
            stateful: false,
            width: canvasSize.width,
            height: canvasSize.height
        });

        fabricCanvas.calcOffset();
        fabricCanvas.freeDrawingBrush.width = config.brushWidth;
        fabricCanvas.freeDrawingBrush.color = config.localColor;

        if (opts.isRemote === true) {
            remoteCanvas = fabricCanvas;
            fabricCanvas.tag = 'remote';
        } else if (opts.isRemote === false) {
            localCanvas = fabricCanvas;
            fabricCanvas.tag = 'local';
        }

        return fabricCanvas;
    };

    var removePathFromCanvas = function (canvas, path) {
        canvas.remove(path);
        canvas.renderAll(false);
    };

    var createPathRemoveTimer = function (canvas, path) {
        var timer = $timeout(function () {
            removePathFromCanvas(canvas, path);
        }, config.drawingRemoveTime);

        pathRemoveTimers.push(timer);
    };

    var cancelPathRemoveTimers = function () {
        pathRemoveTimers.forEach(function (t) {
            $timeout.cancel(t);
        });
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

            createPathRemoveTimer(canvas, e.path);
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
                    scaleX: o.scaleY / (remoteCanvasSize.width  / canvasSize.width)
                });

                canvas.add(o);
                canvas.renderAll(true);
                createPathRemoveTimer(canvas, o);
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
            opts.isRemote = true;
            setUpDrawingCanvas(canvasId, opts);
        },
        setUpLocalCanvas: function (canvasId, opts) {
            opts.isRemote = false;
            setUpDrawingCanvas(canvasId, opts);
        },
        setUpDataCallbacks: function () {
            peerFactory.registerCallback('newPathCreated', function (data) {
                var parsedData = angular.fromJson(data);
                addPathToCanvas(parsedData.tag, parsedData.data,
                                parsedData.currentlyZoomedInRemoteCanvas, parsedData.remoteCanvasSize);
            });
        },
        clearLocalCanvas: function () {
            clearCanvas(localCanvas);
        },
        clearRemoteCanvas: function () {
            clearCanvas(remoteCanvas);
        },
        tearDownDrawingFactory: function () {
            cancelPathRemoveTimers();
            peerFactory.clearCallback('newPathCreated');
        }
    };
});

