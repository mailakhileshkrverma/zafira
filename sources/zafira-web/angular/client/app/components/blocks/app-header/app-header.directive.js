(function () {
    'use strict';

    angular.module('app.appHeader').directive('appHeader', function () {
        return {
            templateUrl: 'app/components/blocks/app-header/app-header.html',
            controller: function AppHeaderController() {
                const vm = {
                    mainData: {},
                    companyLogo: {},
                    currentUser: {}
                };

                return vm;

            },
            scope: {
                mainData: "=",
                companyLogo: "=",
                currentUser: "="
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });
})();
