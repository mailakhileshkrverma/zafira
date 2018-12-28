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

    function TestsRunsFilterController(FilterService, DEFAULT_SC, TestRunService, $q, ProjectService,
                                       testsRunsService) {
        const subjectName = 'TEST_RUN';
        const FAST_SEARCH_TEMPLATE = {currentModel: 'testSuite'};
        const DEFAULT_FILTER_VALUE = {
            subject: {
                name: subjectName,
                criterias: [],
                publicAccess: false
            }
        };
        const CURRENT_CRITERIA = {
            name: 'CRITERIA',
            value: null,
            type: []
        };
        const CURRENT_OPERATOR = {
            name: 'OPERATOR',
            value: null,
            type: []
        };
        const CURRENT_VALUE = {
            name: 'VALUE',
            value: null
        };
        const SELECT_CRITERIAS = ['ENV', 'PLATFORM', 'PROJECT', 'STATUS'];
        const STATUSES = ['PASSED', 'FAILED', 'SKIPPED', 'ABORTED', 'IN_PROGRESS', 'QUEUED', 'UNKNOWN'];
        const vm = {
            addFilterExpanded: false,
            currentCriteria: angular.copy(CURRENT_CRITERIA),
            currentOperator: angular.copy(CURRENT_OPERATOR),
            currentValue: angular.copy(CURRENT_VALUE),
            filter: angular.copy(DEFAULT_FILTER_VALUE),
            filters: [],
            filterBlockExpand: false,
            fastSearchBlockExpand: false,
            collapseFilter: false,
            selectedFilterId: null,
            searchFormIsEmpty: true,
            searchParams: testsRunsService.getLastSearchParams(),
            statuses: STATUSES,

            matchMode: matchMode,
            reset: reset,
            createFilter: createFilter,
            updateFilter: updateFilter,
            deleteFilter: deleteFilter,
            clearAndOpenFilterBlock: clearAndOpenFilterBlock,
            searchByFilter: searchByFilter,
        };

        vm.$onInit = init;

        return vm;

        function init() {
            vm.filterBlockExpand = true;
            vm.fastSearchBlockExpand = true;
            loadFilters();
            loadPublicFilters();
        }

        function loadFilters() {
            const loadFilterDataPromises = [];

            loadFilterDataPromises.push(loadEnvironments());
            loadFilterDataPromises.push(loadPlatforms());
            loadFilterDataPromises.push(loadProjects());

            return $q.all(loadFilterDataPromises).then(function(values) {
                loadSubjectBuilder();
            });
        }

        function loadPublicFilters() {
            FilterService.getAllPublicFilters().then(function (rs) {
                if(rs.success) {
                    vm.filters = rs.data;
                }
            });
        }

        function loadEnvironments() {
            return TestRunService.getEnvironments().then(function(rs) {
                if(rs.success) {
                    vm.environments = rs.data.filter(function (env) {
                        return !!env;
                    });

                    return vm.environments;
                } else {
                    alertify.error(rs.message);
                    $q.reject(rs.message);
                }
            });
        }

        function loadPlatforms() {
            return TestRunService.getPlatforms().then(function (rs) {
                if (rs.success) {
                    vm.platforms = rs.data.filter(function (platform) {
                        return platform && platform.length;
                    });

                    return vm.platforms;
                } else {
                    alertify.error(rs.message);
                    $q.reject(rs.message);
                }
            });
        }

        function loadProjects() {
            return ProjectService.getAllProjects().then(function (rs) {
                if (rs.success) {
                    vm.allProjects = rs.data.map(function(proj) {
                        return proj.name;
                    });

                    return rs.data;
                } else {
                    $q.reject(rs.message);
                }
            });
        }

        function loadSubjectBuilder() {
            FilterService.getSubjectBuilder(subjectName).then(function (rs) {
                if(rs.success) {
                    vm.subjectBuilder = rs.data;
                    vm.subjectBuilder.criterias.forEach(function(criteria) {
                        if (isSelectCriteria(criteria)) {
                            switch(criteria.name) {
                                case 'ENV':
                                    criteria.values = vm.environments;
                                    break;
                                case 'PLATFORM':
                                    criteria.values = vm.platforms;
                                    break;
                                case 'PROJECT':
                                    criteria.values = vm.allProjects;
                                    break;
                                case 'STATUS':
                                    criteria.values = STATUSES;
                                    break;
                            }
                        }
                    });
                }
            });
        }

        function isSelectCriteria(criteria) {
            return criteria && SELECT_CRITERIAS.indexOf(criteria.name) >= 0;
        }

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

        function updateFilter() {
            FilterService.updateFilter(vm.filter).then(function (rs) {
                if (rs.success) {
                    alertify.success('Filter was updated');
                    vm.filters[vm.filters.indexOfField('id', rs.data.id)] = rs.data;
                    clearAndOpenFilterBlock(false);
                    //TODO: search if filter is applied?
                } else {
                    alertify.error(rs.message);
                }
            });
        }

        function clearFilter() {
            vm.filter = angular.copy(DEFAULT_FILTER_VALUE);
            clearFilterSlice();
        }

        function deleteFilter(id) {
            FilterService.deleteFilter(id).then(function (rs) {
                if (rs.success) {
                    alertify.success('Filter was deleted');
                    vm.filters.splice(vm.filters.indexOfField('id', id), 1);
                    clearFilter();
                    vm.collapseFilter = false;
                } else {
                    alertify.error(rs.message);
                }
            });
        }

        function chooseFilter(filter) {
            vm.collapseFilter = true;
            vm.filter = angular.copy(filter);
        }

        function clearAndOpenFilterBlock(value) {
            clearFilter();
            vm.collapseFilter = value;
        }

        function clearFilterSlice() {
            vm.currentCriteria = angular.copy(CURRENT_CRITERIA);
            vm.currentOperator = angular.copy(CURRENT_OPERATOR);
            vm.currentValue = angular.copy(CURRENT_VALUE);
        }

        function searchByFilter(filter, chipsCtrl) {
            if (vm.selectedFilterId === filter.id) { return; } //TODO: check

            vm.selectedFilterId = filter.id;
            vm.chipsCtrl = chipsCtrl;
            getTestRuns();
        }

        function getTestRuns(page, pageSize) { //TODO: copied from containing page controller -> refactor DRY
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
