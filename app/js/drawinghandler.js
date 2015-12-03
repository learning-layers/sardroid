'use strict';

var drawinghandler = angular.module('drawinghandler',['sardroid', 'peerhandler']);

drawinghandler.factory('drawingFactory', function ($rootScope, $window, $state, $interval, peerFactory) {
    
    var remoteCanvas = null;
    var localCanvas  = null;

    var config = $rootScope.config;

    peerFactory.addDatacallback(function(data) {
            var data = JSON.parse(data);
            addPathToCanvas(data.tag, data.data);
    });

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
        } else if (opts.isRemote === false){
            localCanvas = fabricCanvas;
            fabricCanvas.tag = 'local';
        }
        return fabricCanvas;
    };

    var setUpCanvasEvents = function(canvas) {

    canvas.on('path:created', function(e) {
        var data = JSON.stringify(e.path);
        console.log(data);
        peerFactory.sendDataToPeer(JSON.stringify({
            tag:  canvas.tag,
            data: data
            }))
        });
    };

    var addPathToCanvas = function (canvasTag, pathData) {
        if (canvasTag === 'local') {
            addNewPathToCanvas(localCanvas, pathData);
        }
        else if (canvasTag === 'remote') {
            addNewPathToCanvas(remoteCanvas, pathData);
        }
    };

    var addNewPathToCanvas = function (canvas, pathData) {
       console.log(canvas);
       console.log(pathData);
       new fabric.Path.fromObject({path: pathData}, function (path) {
           path.fill = config.drawings.remoteColor;
           canvas.add(path);
           canvas.renderAll();
       });
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
        }
});
