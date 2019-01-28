(function() {
    'use strict';

    angular.module('app.testsRunsButtons')
    .directive('testsRunsButtons', function() {
        return {
            templateUrl: 'app/components/blocks/tests-runs-buttons/tests-runs-buttons.html',
            controller: TestsRunsButtonsController,
            scope: {
                onFilterChange: '&'
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });

    function TestsRunsButtonsController(FilterService, DEFAULT_SC, TestRunService, $q, ProjectService,
                                       testsRunsService, $cookieStore, UserService, $timeout, $mdDateRangePicker,
                                       windowWidthService, $rootScope) {
        const vm = {
            
        };

        vm.$onInit = init;

        return vm;

        function init() {
            
        }

    }
})();
