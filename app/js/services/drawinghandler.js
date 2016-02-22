'use strict';

/*
 * Factory for setting up a FabricJS drawing surface on a canvas.
 * Also sets up callbacks for PeerJS, so it can receive line data
 * and draw them accordingly.
 */

var drawinghandler = angular.module('drawinghandler',[]);

drawinghandler.factory('drawingFactory', function (configFactory, $window, $state, $timeout, peerFactory) {

    // References to two of the canvasi
    var remoteCanvas = null;
    var localCanvas  = null;

    // Tag of the canvas that is currently fullscreen
    var currentlyZoomedInCanvas = null;

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
        console.log('removing path');
        canvas.remove(path);
        canvas.renderAll(true);
    };

    var createPathRemoveTimer = function(canvas, path) {
        console.log('creating timer')
        var timer = $timeout(function () {
             removePathFromCanvas(canvas, path);
         }, config.drawingRemoveTime);

         pathRemoveTimers.push(timer);
    };

    var cancelPathRemoveTimers = function() {
        console.log('cancel timers');
        pathRemoveTimers.map(function (t){
            $timeout.cancel(t);
        })
    };

    var setUpCanvasEvents = function(canvas) {
        canvas.on('path:created', function(e) {

            var data = JSON.stringify(e.path);

            peerFactory.sendDataToPeer(JSON.stringify({
                type                          : 'newPathCreated',
                tag                           : canvas.tag,
                data                          : data,
                currentlyZoomedInRemoteCanvas : currentlyZoomedInCanvas,
                remoteCanvasSize              : canvasSize
            }));

            createPathRemoveTimer(canvas, e.path);
        });
    };

    var addPathToCanvas = function (canvasTag, pathData, currentlyZoomedInRemoteCanvas, remoteCanvasSize) {
        if (canvasTag === 'local') {
            addNewPathToCanvas(remoteCanvas, pathData, currentlyZoomedInRemoteCanvas, remoteCanvasSize);
        }
        else if (canvasTag === 'remote') {
            addNewPathToCanvas(localCanvas, pathData, currentlyZoomedInRemoteCanvas, remoteCanvasSize);
        }
    };

    var addNewPathToCanvas = function (canvas, pathData, currentlyZoomedInRemoteCanvas, remoteCanvasSize) {
        console.log("remoteCanvasSize", remoteCanvasSize);
        console.log("own canvas size", canvasSize);
        pathData = JSON.parse(pathData);
        fabric.util.enlivenObjects([pathData], function(objects) {

        objects.forEach(function (o) {
                o.stroke = config.remoteColor;

                o.set({
                    top:    o.top    / (remoteCanvasSize.height / canvasSize.height),
                    left:   o.left   / (remoteCanvasSize.width  / canvasSize.width),
                    scaleY: o.scaleX / (remoteCanvasSize.height / canvasSize.height),
                    scaleX: o.scaleY / (remoteCanvasSize.width  / canvasSize.width)
                });

                if (currentlyZoomedInCanvas == null && currentlyZoomedInRemoteCanvas != null) {
                    o.set({
                        top:    o.top    * config.size.height,
                        left:   o.left   * config.size.width,
                        scaleY: o.scaleX * config.size.height,
                        scaleX: o.scaleY * config.size.width
                    });
                } else if (currentlyZoomedInCanvas != null && currentlyZoomedInRemoteCanvas == null) {
                    o.set({
                        top:    o.top    / config.size.height,
                        left:   o.left   / config.size.width,
                        scaleY: o.scaleX / config.size.height,
                        scaleX: o.scaleY / config.size.width
                    });
                }

                canvas.add(o);
                canvas.renderAll(true);
                createPathRemoveTimer(canvas, o);
            })
        })
    };

    var setUpDrawingCanvas = function (canvasId, opts) {
           var canvas = initFabricJS(canvasId, opts);
           setUpCanvasEvents(canvas);
    };

    var zoomInCanvas = function (canvas) {
        canvas.setWidth($window.innerWidth);
        canvas.setHeight($window.innerHeight * 0.87);

        var objects = canvas.getObjects();
        for (var o in objects) {
            objects[o].set({
                top:    o.top    * config.size.height,
                left:   o.left   * config.size.width,
                scaleY: o.scaleX * config.size.height,
                scaleX: o.scaleY * config.size.width
            })
        }

        canvas.renderAll(true);

        canvas.calcOffset();
    };

    var zoomOutCanvas = function (canvas) {
        canvas.setWidth(canvasSize.width);
        canvas.setHeight(canvasSize.height);

        var objects = canvas.getObjects();
        for (var o in objects) {
            objects[o].set({
                top:    o.top    / config.size.height,
                left:   o.left   / config.size.width,
                scaleY: o.scaleX / config.size.height,
                scaleX: o.scaleY / config.size.width
            })
        }

        canvas.renderAll(true);
        canvas.calcOffset();
    };

    // Public API begins here
    return {
           setUpRemoteCanvas: function(canvasId, opts) {
                opts.isRemote = true;
                setUpDrawingCanvas(canvasId, opts);
           },
           setUpLocalCanvas: function(canvasId, opts) {
                opts.isRemote = false;
                setUpDrawingCanvas(canvasId, opts);
           },
           setUpDataCallbacks: function() {
                peerFactory.registerCallback('newPathCreated', function (data) {
                    var data = JSON.parse(data);
                    addPathToCanvas(data.tag, data.data, data.currentlyZoomedInRemoteCanvas, data.remoteCanvasSize);
                });
           },
           zoomInCanvasByTag: function (tag) {
               currentlyZoomedInCanvas = tag;
               switch (tag) {
                   case 'local':
                       zoomInCanvas(localCanvas);
                   break;
                   case 'remote':
                       zoomInCanvas(remoteCanvas);
                   break;
               }
           },
           zoomOutCanvasByTag: function (tag) {
               currentlyZoomedInCanvas = null;
               switch (tag) {
                   case 'local':
                       zoomOutCanvas(localCanvas);
                   break;
                   case 'remote':
                       zoomOutCanvas(remoteCanvas);
                   break;
               }
           },
           tearDownDrawingFactory: function () {
                cancelPathRemoveTimers();
                peerFactory.clearCallback('newPathCreated');
                //peerFactory.clearAllCallbacks();
           }
        }
});

