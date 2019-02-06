(function () {
    'use strict';

    angular.module('app.copyright').directive('copyright', function () {
        return {
            templateUrl: 'app/components/blocks/copyright/copyright.html',
            controller: function copyrightController($rootScope) {
                const vm = {
                    version: $rootScope.version
                };
                
                return vm;

            },
            scope: {
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });
})();
