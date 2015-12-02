'use strict';

var drawinghandler = angular.module('drawinghandler',['sardroid', 'peerhandler']);

drawinghandler.factory('drawingFactory', function ($rootScope, $window, $state, $interval, peerFactory) {
    
    var remoteCanvas = null;
    var localCanvas  = null;

    var config = $rootScope.config;

    var initFabricJS = function (canvasId, opts) {
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
        return fabricCanvas;
    };

    var setUpDrawingCanvas = function (canvasId, opts) {
           var canvas = initFabricJS(canvasId, opts);
           $interval(function() {
                console.log(JSON.stringify(canvas));
            }, 1000)
    };

    return {
           setUpRemoteCanvas: function(canvasId, opts) {
                opts.isRemote = true;
                setUpDrawingCanvas(canvasId, opts);
           },
           setUpLocalCanvas: function(canvasId, opts) {
                opts.isRemote = false;
                setUpDrawingCanvas(canvasId, opts);
            }
        }

});
