(function() {
    'use strict';

    angular.module('app.testsRunsSearch')
    .directive('testsRunsSearch', function() {
        return {
            templateUrl: 'app/components/blocks/tests-runs-search/tests-runs-search.html',
            controller: TestsRunsSearchController,
            scope: {
                onFilterChange: '&'
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });

    function TestsRunsSearchController(windowWidthService, testsRunsService) {
        const vm = {
            isMobile: windowWidthService.isMobile,
            isMobileSearchActive: false,
            fastSearchBlockExpand: false,
            isFilterActive: testsRunsService.isFilterActive,
        };

        vm.$onInit = init;

        return vm;

        function init() {
            vm.fastSearchBlockExpand = true;
        }

    }
})();
