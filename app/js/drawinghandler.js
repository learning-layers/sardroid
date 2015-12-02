'use strict';

var drawinghandler = angular.module('drawinghandler',['sardroid']);

drawinghandler.factory('drawingFactory', function ($rootScope, $window) {
    
    var remoteCanvas = null;
    var localCanvas  = null;
    var config = $rootScope.config;

    var initFabricJS = function (canvasId, opts) {
        console.log($rootScope.config.drawings);
        var fabricCanvas = new fabric.Canvas(canvasId, {
            isDrawingMode: true,
            width:  $window.innerWidth *  config.drawings.size.width,
            height: $window.innerHeight * config.drawings.size.height
        });

        fabricCanvas.calcOffset();
        fabricCanvas.freeDrawingBrush.width = config.drawings.brushWidth;
        if (opts.isRemote === true) {
            fabricCanvas.freeDrawingBrush.color = config.drawings.remoteColor;
            remoteCanvas = fabricCanvas;
        } else if (opts.isRemote === false){
            fabricCanvas.freeDrawingBrush.color = config.drawings.localColor;
            localCanvas = fabricCanvas;
        }
    };

    var setUpDrawingCanvas = function (canvasId, callback, opts) {
           initFabricJS(canvasId, opts);
    };

    return {
            setUpRemoteCanvas: function(canvasId, callback, opts) {
                opts.isRemote = true;
                setUpDrawingCanvas(canvasId, callback, opts);
            },
            setUpLocalCanvas: function(canvasId, callback, opts) {
                opts.isRemote = false;
                setUpDrawingCanvas(canvasId, callback, opts);
            }
        }

});
