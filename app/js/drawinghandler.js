'use strict';

var drawinghandler = angular.module('drawinghandler',['sardroid', 'peerhandler']);

drawinghandler.factory('drawingFactory', function ($rootScope, $window, $state, $timeout, peerFactory) {
    
    var remoteCanvas = null;
    var localCanvas  = null;

    var config = $rootScope.config;

    var pathRemoveTimers = [];

    var initFabricJS = function (canvasId, opts) {
        var fabricCanvas = new fabric.Canvas(canvasId, {
            isDrawingMode: true,
            width:  $window.innerWidth *  config.drawings.size.width,
            height: $window.innerHeight * config.drawings.size.height
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
    }

    var createPathRemoveTimer = function(canvas, path) {
        console.log('creating timer')
        var timer = $timeout(function () {
             removePathFromCanvas(canvas, path);
         }, config.drawings.drawingRemoveTime);

         pathRemoveTimers.push(timer);
    }

    var cancelPathRemoveTimers = function() {
        console.log('cancel timers');
        pathRemoveTimers.map(function (t){
            $timeout.cancel(t);
    })
    }

    var setUpCanvasEvents = function(canvas) {

        canvas.on('path:created', function(e) {
            var data = JSON.stringify(e.path);
            peerFactory.sendDataToPeer(JSON.stringify({
                tag:  canvas.tag,
                data: data
                }))
            createPathRemoveTimer(canvas, e.path);
            });
    };

    var addPathToCanvas = function (canvasTag, pathData) {
        console.log('addPathToCanvas')
        if (canvasTag === 'local') {
            addNewPathToCanvas(remoteCanvas, pathData);
        }
        else if (canvasTag === 'remote') {
            addNewPathToCanvas(localCanvas, pathData);
        }
    };

    var addNewPathToCanvas = function (canvas, pathData) {
        pathData = JSON.parse(pathData);
        fabric.util.enlivenObjects([pathData], function(objects) {

        objects.forEach(function (o) {
            o.stroke = config.drawings.remoteColor;
            canvas.add(o);
            
            createPathRemoveTimer(canvas, o);
        })
        //canvas.renderTop();
        })
    };

    var setUpDrawingCanvas = function (canvasId, opts) {
           var canvas = initFabricJS(canvasId, opts);
           setUpCanvasEvents(canvas);
    };

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
                    addPathToCanvas(data.tag, data.data);
                })
           },
           tearDownDrawingFactory: function () {
                cancelPathRemoveTimers();
                peerFactory.removeDatacallbacks();
           }
        }
});
