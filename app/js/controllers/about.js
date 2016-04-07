'use strict';

/*
 */

angular.module('about', [])
.controller('AboutCtrl', function ($scope, $ionicModal) {
    $scope.showAboutPopup = function () {
        $ionicModal.fromTemplateUrl(
            'templates/modals/about-soar.html', {
                scope: $scope,
                animation: 'slide-in-up'
        }).then(function (modal) {
            console.log('asdasdasdasdasdasdasdasasdadsasd');
            $scope.modal = modal;
            $scope.modal.show();
        });
    };

    $scope.hideAboutPopup = function () {
        $scope.modal.hide();
    };

    $scope.$on('$destroy', function () {
        $scope.modal.remove();
    });
});

