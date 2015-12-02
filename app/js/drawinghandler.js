'use strict';

var drawinghandler = angular.module('drawinghandler',[]);

drawinghandler.factory('drawingFactory', function ($rootScope, $window) {
    
    var remoteCanvas = null;
    var localCanvas  = null;

    var initFabricJS = function (canvasId, opts) {
        var fabricCanvas = new fabric.Canvas(canvasId, {
            isDrawingMode: true,
            width:  $window.innerWidth * 0.56,
            height: $window.innerHeight * 0.46
        });
        fabricCanvas.calcOffset();
        if (opts.isRemote === true) {
            remoteCanvas = fabricCanvas;
        } else if (opts.isRemote === false){
            localCanvas = fabricCanvas;
        }
    };


    var setUpDrawingCanvas = function (canvasId, callback, opts) {
           initFabricJS(canvasId, opts);
        }
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
