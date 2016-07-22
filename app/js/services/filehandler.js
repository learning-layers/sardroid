'use strict';

/*
 * Module for handling various file-system related tasks
 */

angular.module('filehandler', [])
.factory('fileFactory', function ($window) {
    return {
        createDataDirIfNotExist: function () {
            if ($window.cordova) {
                return new Promise(function (resolve, reject) {
                    var rejectErr = function (e) {
                        reject(e);
                    };

                    xwalk.experimental.native_file_system.requestNativeFileSystem('dcim', function (fs) {
                        fs.root.getDirectory('/dcim/soar-calls', { create: true }, function () {
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

