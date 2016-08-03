'use strict';

/*
 * Module for handling various file-system related tasks
 */

angular.module('filehandler', [])
.factory('fileFactory', function ($window) {
    return {
        // Taken from http://stackoverflow.com/a/16245768
        base64ToBlob: function (b64Data, contentType, sliceSize) {
            b64Data = b64Data.split(',')[1];
            contentType = contentType || 'image/png';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            return new Blob(byteArrays, { type: contentType });
        },
        createDataDirIfNotExist: function () {
            return this.createDirectory('soar-calls');
        },
        createDirectory: function (path) {
            if ($window.cordova) {
                return new Promise(function (resolve, reject) {
                    var rejectErr = function (e) {
                        reject(e);
                    };

                    xwalk.experimental.native_file_system.requestNativeFileSystem('dcim', function (fs) {
                        fs.root.getDirectory('/dcim/' + path, { create: true }, function () {
                            resolve();
                        });
                    }, rejectErr);
                });
            }
        },
        emptyCallDataDir: function () {
            var self = this;

            return new Promise(function (resolve, reject) {
                var rejectErr = function (e) {
                    reject(e);
                };

                if ($window.cordova) {
                    xwalk.experimental.native_file_system.requestNativeFileSystem('dcim', function (fs) {
                        fs.root.getDirectory('/dcim/soar-calls', { create: false }, function (dir) {
                            dir.removeRecursively(function () {
                                return self.createDataDirIfNotExist();
                            }, rejectErr);
                        });
                    }, rejectErr);
                } else {
                    resolve('Dummy resolve');
                }
            });
        },
        writeToFile: function (opts) {
            return new Promise(function (resolve, reject) {
                var rejectErr = function (e) {
                    reject(e);
                };

                if ($window.cordova) {
                    xwalk.experimental.native_file_system.requestNativeFileSystem('dcim',
                    function (fs) {
                        fs.root.getFile('/dcim/soar-calls/' + opts.fileName, { create: true },
                           function (entry) {
                               entry.createWriter(function (writer) {
                                   writer.write(opts.data);
                                   resolve();
                               }, rejectErr);
                           }, rejectErr);
                    }, rejectErr);
                } else {
                    resolve('Dummy resolve');
                }
            });
        }
    };
});

