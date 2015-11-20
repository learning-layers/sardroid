'use strict';

angular.module('sardroid', ['ionic', 'login', 'home', 'contacts', 'userprofile'])

.run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if(window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if(window.StatusBar) {
                StatusBar.styleDefault();
            }
        });
}).config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('login', {
            url: '/login',
            templateUrl: 'templates/login.html',
            controller: 'LoginCtrl'
        }).state('tabs', {
            url: '/tab',
            abstract: true,
            templateUrl: 'templates/tabs.html'
        })
        .state('userprofile', {
            url: '/userprofile',
            templateUrl: 'templates/userprofile.html',
            controller: 'UserProfileCtrl',
            params: { user: null }
        })
        .state('tabs.home', {
            url: '/home',
            views: {
                'home-tab': {
                    templateUrl: 'templates/home.html',
                    controller: 'HomeCtrl'
                }
            }
        })
        .state('tabs.contacts', {
            url: '/contacts',
            views: {
                 'contacts-tab': {
                    templateUrl: 'templates/contacts.html',
                    controller: 'ContactsCtrl'
                }
            }
        });

    $urlRouterProvider.otherwise('/login');
});