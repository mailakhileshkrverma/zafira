(function () {
    'use strict';

    angular.module('app.appCustomizer').directive('appCustomizer', function () {
        return {
            templateUrl: 'app/components/blocks/app-customizer/app-customizer.html',
            controller: function appCustomizerController() {
                const vm = {
                    mainData: {}
                };

                return vm;

            },
            scope: {
                mainData: "="
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });
})();
