(function () {
    'use strict';

    angular.module('app.appCustomizerColor').directive('appCustomizerColor', function () {
        return {
            templateUrl: 'app/components/blocks/app-customizer-color/app-customizer-color.html',
            controller: function appCustomizerColorController() {
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
