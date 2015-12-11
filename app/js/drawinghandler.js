'use strict';

/*
 * Factory for setting up a FabricJS drawing surface on a canvas.
 * Also sets up callbacks for PeerJS, so it can receive line data
 * and draw them accordingly.
 */

var drawinghandler = angular.module('drawinghandler',['sardroid', 'peerhandler']);

drawinghandler.factory('drawingFactory', function ($rootScope, $window, $state, $timeout, peerFactory) {

    // References to two of the canvasi
    var remoteCanvas = null;
    var localCanvas  = null;

    // Tag of the canvas that is currently fullscreen
    var currentlyZoomedInCanvas = null;

    // Reference to rootscope configuration object
    var config = $rootScope.config;

    // Array that will eventually contain a bunch of angular $timeouts
    // We need to keep track of em so we can easily cancel them all if need be
    var pathRemoveTimers = [];

    var canvasSize = {
        width:  $window.innerWidth *  config.drawings.size.width,
        height: $window.innerHeight * config.drawings.size.height
    };

    // Takes in a selector and an optionals object
    // Size of canvas has to be calculated at runtime
    var initFabricJS = function (canvasId, opts) {
        var fabricCanvas = new fabric.Canvas(canvasId, {
            isDrawingMode: true,
            width: canvasSize.width,
            height: canvasSize.height
        });

        fabricCanvas.calcOffset();
        fabricCanvas.freeDrawingBrush.width = config.drawings.brushWidth;
        fabricCanvas.freeDrawingBrush.color = config.drawings.localColor;

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
        canvas.renderAll();
    };

    var createPathRemoveTimer = function(canvas, path) {
        console.log('creating timer')
        var timer = $timeout(function () {
             removePathFromCanvas(canvas, path);
         }, config.drawings.drawingRemoveTime);

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
                type: 'newPathCreated',
                tag:  canvas.tag,
                data: data,
                currentlyZoomedInCanvas: currentlyZoomedInCanvas
            }));

            createPathRemoveTimer(canvas, e.path);
        });
    };

    var addPathToCanvas = function (canvasTag, pathData, currentlyZoomedInCanvas) {
        console.log('addPathToCanvas')
        if (canvasTag === 'local') {
            addNewPathToCanvas(remoteCanvas, pathData, currentlyZoomedInCanvas);
        }
        else if (canvasTag === 'remote') {
            addNewPathToCanvas(localCanvas, pathData, currentlyZoomedInCanvas);
        }
    };

    var addNewPathToCanvas = function (canvas, pathData, currentlyZoomedInCanvas) {
        pathData = JSON.parse(pathData);
        console.log(pathData.currentlyZoomedInCanvas);
        fabric.util.enlivenObjects([pathData], function(objects) {

        objects.forEach(function (o) {
            console.log(currentlyZoomedInCanvas);
                o.stroke = config.drawings.remoteColor;
                /*o.set({
                    top: canvas.height/2,
                    left: canvas.width/2,
                    scaleY: canvas.height / o.height,
                    scaleX: canvas.width / o.width
                });*/
                canvas.add(o);
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
        canvas.setHeight($window.innerHeight * 0.9);
        canvas.calcOffset();
    };

    var zoomOutCanvas = function (canvas) {
        canvas.setWidth(canvasSize.width);
        canvas.setHeight(canvasSize.height);
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
                peerFactory.addDatacallback(function (data) {
                    var data = JSON.parse(data);
                    addPathToCanvas(data.tag, data.data, data.currentlyZoomedInCanvas);
                })
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
                peerFactory.removeDatacallbacks();
           }
        }
});

