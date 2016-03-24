'use strict';

/*
 * Module for handling various file-system related tasks
 */

angular.module('filehandler', [])
.factory('fileFactory', function ($window, $cordovaFile) {
    var dataDir = 'soar-calls';

    return {
        createDataDirIfNotExist: function () {
            if ($window.cordova) {
                $cordovaFile.createDir(cordova.file.externalRootDirectory, dataDir, false);
            }
        },
        emptyCallDataDir: function () {
            var self = this;
            return new Promise(function (resolve, reject) {
                console.log(cordova.file.externalRootDirectory + dataDir);

                if ($window.cordova) {
                    $cordovaFile.removeRecursively(cordova.file.externalRootDirectory, dataDir)
                        .then(function () {
                            self.createDataDirIfNotExist();
                            resolve();
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                } else {
                    resolve('Dummy resolve');
                }
            });
        },
        writeToFile: function (opts) {
            return new Promise(function (resolve, reject) {
                if ($window.cordova) {
                    $cordovaFile.writeFile(cordova.file.externalRootDirectory + '/soar-calls', opts.fileName, opts.data)
                    .then(function (success) {
                        resolve(success);
                    })
                    .catch(function (error) {
                        reject(error);
                    });
                } else {
                    resolve('Dummy resolve');
                }
            });
        }
    };
});

