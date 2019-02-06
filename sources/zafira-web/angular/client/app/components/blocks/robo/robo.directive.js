(function () {
    'use strict';

    angular.module('app.robo').directive('robo', function () {
        return {
            templateUrl: 'app/components/blocks/robo/robo.html',
            controller: function roboController() {
                const vm = {
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
