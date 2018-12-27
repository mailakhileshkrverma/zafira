(function() {
    'use strict';

    angular.module('app.testRunCard').directive('testRunCard', function() {
        return {
            templateUrl: 'app/components/blocks/test-run-card/test-run-card.html',
            controller: function TestRunCardController(mediaBreakpoints, windowWidthService) {
                var vm = {
                    testRun: null,
                    singleMode: false,
                    singleWholeInfo: true,
                    mobileBreakpoint: mediaBreakpoints.mobile || 0,
                    windowWidthService: windowWidthService,

                    addToSelectedtestRuns: addToSelectedtestRuns,
                    showSingleVersion: showSingleVersion,
                };

                return vm;

                function addToSelectedtestRuns() {
                    console.dir(vm.onSelect);
                    vm.onSelect && vm.onSelect(vm.testRun);
                }

                function showSingleVersion() {
                    // if(vm.singleMode) { //TODO: fix this after clarification
                    if (true) {
                        var card = angular.element('.test-run-card');
                        vm.singleWholeInfo?card.addClass('_short-info').removeClass('_whole-info'):card.removeClass('_short-info').addClass('_whole-info');
                        vm.singleWholeInfo?vm.singleWholeInfo = false: vm.singleWholeInfo = true;
                        console.log(vm.singleWholeInfo)
                    }
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
