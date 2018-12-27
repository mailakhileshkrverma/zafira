(function() {
    'use strict';

    angular.module('app.testRunCard').directive('testRunCard', function() {
        return {
            templateUrl: 'app/components/blocks/test-run-card/test-run-card.html',
            controller: function TestRunCardController(mediaBreakpoints, windowWidthService) {
                var vm = {
                    testRun: null,
                    singleMode: false,
                    singleWholeInfo: false,
                    mobileBreakpoint: mediaBreakpoints.mobile || 0,
                    windowWidthService: windowWidthService,

                    addToSelectedtestRuns: addToSelectedtestRuns,
                    showDetails: showDetails,
                };

                return vm;

                function addToSelectedtestRuns() {
                    console.dir(vm.onSelect);
                    vm.onSelect && vm.onSelect(vm.testRun);
                }

                function showDetails() {
                    vm.singleWholeInfo = !vm.singleWholeInfo;
                }
            },
            scope: {
                singleMode: '=',
                testRun: '=',
                onSelect: '&'
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });
})();
