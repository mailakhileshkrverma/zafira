(function() {
    'use strict';

    angular.module('app.testsRunsFilter')
    .directive('testsRunsFilter', function() {
        return {
            templateUrl: 'app/components/blocks/tests-runs-filter/tests-runs-filter.html',
            controller: TestsRunsFilterController,
            scope: {
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });

    function TestsRunsFilterController(FilterService, DEFAULT_SC) {
        const FAST_SEARCH_TEMPLATE = {currentModel: 'testSuite'};
        const vm = {
            filterBlockExpand: false,
            collapseFilter: false,
            selectedFilterId: null,
            searchFormIsEmpty: true,

            matchMode: matchMode,
            reset: reset,
            createFilter: createFilter,
        };

        return vm;

        function matchMode(modes) {
            const modesData = getMode();
            const isMode = modesData.filter(function(m) {
                return modes.indexOf(m) !== -1;
            }).length > 0;

            return isMode ||
                (!isMode && modes.indexOf('ANY') !== -1 && modesData.length);
        }

        function getMode() {
            const mode = [];

            if (vm.filterBlockExpand && vm.collapseFilter) {
                if (vm.filter.id) {
                    mode.push('UPDATE');
                } else {
                    mode.push('CREATE');
                }
            }

            if (vm.selectedFilterId) {
                mode.push('APPLY');
            }

            if (!vm.searchFormIsEmpty) {
                mode.push('SEARCH');
            }

            return mode;
        }

        function reset() {
            vm.selectedRange.dateStart = null;
            vm.selectedRange.dateEnd = null;
            vm.searchParams = angular.copy(DEFAULT_SC);
            vm.fastSearch = angular.copy(FAST_SEARCH_TEMPLATE);
            vm.selectedFilterId = null;
            getTestRuns();
            vm.chipsCtrl && (delete vm.chipsCtrl.selectedChip);
        }

        function createFilter() {
            FilterService.createFilter(vm.filter).then(function (rs) {
                if (rs.success) {
                    alertify.success('Filter was created');
                    vm.filters.push(rs.data);
                    clearFilter();
                    vm.collapseFilter = false;
                } else {
                    alertify.error(rs.message);
                }
            });
        }

        function getTestRuns(page, pageSize) { //TODO: copied from containing page -> refactor DRY
            console.log('doing fetching...');

            const projects = $cookieStore.get('projects');
            const filter = vm.selectedFilterId ? '?filterId=' +
                vm.selectedFilterId : undefined;
            const params = {
                date: null,
                toDate: null,
                fromDate: null,
                page: page || 1,
                pageSize: pageSize || 20,
                projects: projects || []
            };
            vm.selectAll = false; //TODO: do it before search call instead of here
            vm.expandedTestRuns = [];

            fillFastSearchParam(params);
            fillDateParam(params);

            vm.searchParams = Object.assign({}, vm.searchParams, params);

            return testsRunsService.fetchTestRuns(vm.searchParams, filter)
            .then(function(rs) { //TODO: Use own service
                console.log(rs);

                const testRuns = rs.results;

                vm.totalResults = rs.totalResults;
                vm.pageSize = rs.pageSize;
                vm.testRuns = testRuns;

                return $q.resolve(vm.testRuns);
            })
            .catch(function(err) {
                console.error(err.message);
                return $q.reject(err);
            });
        }
    }
})();
