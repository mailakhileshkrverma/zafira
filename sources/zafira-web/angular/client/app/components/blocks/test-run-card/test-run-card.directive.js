(function() {
    'use strict';

    angular.module('app.testRunCard').directive('testRunCard', function() {
        return {
            templateUrl: 'app/components/blocks/test-run-card/test-run-card.html',
            controller: function TestRunCardController(mediaBreakpoints, windowWidthService) {
                var vm = {
                    testRun: null,
                    singleMode: false, //TODO make different templates?
                    mobileBreakpoint: mediaBreakpoints.mobile || 0,
                    windowWidthService: windowWidthService
                };

                return vm;
            },
            scope: {
                singleMode: '=',
                testRun: '='
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });
})();
