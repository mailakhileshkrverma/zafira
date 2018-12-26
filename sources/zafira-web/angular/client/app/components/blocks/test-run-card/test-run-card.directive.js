(function() {
    'use strict';

    angular.module('app.testRunCard').directive('testRunCard', function() {
        return {
            templateUrl: 'app/components/blocks/test-run-card/test-run-card.html',
            controller: function TestRunCardController(mediaBreakpoints, windowWidthService) {
                var vm = {
                    testRun: null,
                    singleMode: false, //TODO make different templates?
                    singleWholeInfo: true,
                    mobileBreakpoint: mediaBreakpoints.mobile || 0,
                    windowWidthService: windowWidthService,
                    showSingleVersion: function(){
                        // if(vm.singleMode) {
                        if(true){
                            var card = angular.element('.test-run-card');
                            vm.singleWholeInfo?card.addClass('_short-info').removeClass('_whole-info'):card.removeClass('_short-info').addClass('_whole-info');
                            vm.singleWholeInfo?vm.singleWholeInfo = false: vm.singleWholeInfo = true;
                            console.log(vm.singleWholeInfo)
                        }
                    }
                };
                return vm;
            },
            scope: {
                singleMode: '=',
                testRun: '=',
                
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });
})();
