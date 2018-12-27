(function () {
    'use strict';

    angular
    .module('app.testsRuns')
    .controller('TestsRunsController', [
        '$scope',
        '$rootScope',
        '$mdToast',
        '$mdMenu',
        '$location',
        '$window',
        '$cookieStore',
        '$mdDialog',
        '$mdConstant',
        '$interval',
        '$timeout',
        '$stateParams',
        '$mdDateRangePicker',
        '$q',
        'FilterService',
        'ProjectService',
        'TestService',
        'TestRunService',
        'UtilService',
        'UserService',
        'SettingsService',
        'ProjectProvider',
        'ConfigService',
        'SlackService',
        'DownloadService',
        'API_URL',
        'DEFAULT_SC',
        'OFFSET',
        'TestRunsStorage',
        '$tableExpandUtil',
        '$transitions',
        'resolvedTestRuns',
        'testsRunsService',
        TestsRunsController]);

    function TestsRunsController($scope, $rootScope, $mdToast, $mdMenu, $location, $window,
                                 $cookieStore, $mdDialog, $mdConstant, $interval, $timeout,
                                 $stateParams, $mdDateRangePicker, $q, FilterService,
                                 ProjectService, TestService, TestRunService, UtilService,
                                 UserService, SettingsService, ProjectProvider, ConfigService,
                                 SlackService, DownloadService, API_URL, DEFAULT_SC, OFFSET,
                                 TestRunsStorage, $tableExpandUtil, $transitions, resolvedTestRuns,
                                 testsRunsService) {
        const subjectName = 'TEST_RUN';
        const DEFAULT_FILTER_VALUE = {
            subject: {
                name: subjectName,
                criterias: [],
                publicAccess: false
            }
        };
        const FAST_SEARCH_TEMPLATE = {currentModel: 'testSuite'};
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
        const DATE_CRITERIAS = ['DATE'];
        const DATE_CRITERIAS_PICKER_OPERATORS = ['EQUALS', 'NOT_EQUALS', 'BEFORE', 'AFTER'];
        const STATUSES = ['PASSED', 'FAILED', 'SKIPPED', 'ABORTED', 'IN_PROGRESS', 'QUEUED', 'UNKNOWN'];

        const vm = {
            testRuns: resolvedTestRuns.results || [],
            totalResults: resolvedTestRuns.totalResults || 0,
            pageSize: resolvedTestRuns.pageSize,
            currentPage: resolvedTestRuns.page,
            currentCriteria: angular.copy(CURRENT_CRITERIA),
            currentOperator: angular.copy(CURRENT_OPERATOR),
            currentValue: angular.copy(CURRENT_VALUE),
            searchFormIsEmpty: true,
            collapseFilter: false,
            fastSearch: angular.copy(FAST_SEARCH_TEMPLATE),
            filters: [],
            filter: angular.copy(DEFAULT_FILTER_VALUE),
            filterBlockExpand: false,
            fastSearchBlockExpand: false,
            addFilterExpanded: false,
            searchParams: testsRunsService.getLastSearchParams(),
            selectedTestRuns: {},
            selectedFilterRange: {
                selectedTemplate: null,
                selectedTemplateName: null,
                dateStart: null,
                dateEnd: null,
                showTemplate: false,
                onePanel: true
            },
            selectedRange: {
                selectedTemplate: null,
                selectedTemplateName: null,
                dateStart: null,
                dateEnd: null,
                showTemplate: false,
                fullscreen: false
            },
            SYMBOLS: {
                EQUALS: " == ",
                NOT_EQUALS: " != ",
                CONTAINS: " cnt ",
                NOT_CONTAINS: " !cnt ",
                MORE: " > ",
                LESS: " < ",
                BEFORE: " <= ",
                AFTER: " >= ",
                LAST_24_HOURS: " last 24 hours",
                LAST_7_DAYS: " last 7 days",
                LAST_14_DAYS: " last 14 days",
                LAST_30_DAYS: " last 30 days"
            },
            DATE_CRITERIAS: ['DATE'],
            DATE_CRITERIAS_PICKER_OPERATORS: ['EQUALS', 'NOT_EQUALS', 'BEFORE', 'AFTER'],
            statuses: STATUSES,

            isTestRunsEmpty: isTestRunsEmpty,
            matchMode: matchMode,
            reset: reset,
            getTestRuns: getTestRuns,
            clearAndOpenFilterBlock: clearAndOpenFilterBlock,
            createFilter: createFilter,
            chooseFilter: chooseFilter,
            deleteFilter: deleteFilter,
            updateFilter: updateFilter,
            searchByFilter: searchByFilter,
            onFilterSliceUpdate:onFilterSliceUpdate,
            getLengthOfSelectedTestRuns: getLengthOfSelectedTestRuns,
            areTestRunsFromOneSuite: areTestRunsFromOneSuite,
            showCompareDialog: showCompareDialog,
            batchRerun: batchRerun,
            batchDelete: batchDelete,
            abortSelectedTestRuns: abortSelectedTestRuns,
            batchEmail: batchEmail,
            addChip: addChip,
            changeChip: changeChip,
            onChangeCriteria: onChangeCriteria,
            isEqualDate: isEqualDate,
            pick: pick,
            addToSelectedTestRuns: addToSelectedTestRuns,
            showDetailsDialog: showDetailsDialog,
        };

        vm.$onInit = function() {
            init();
        };

        $scope.$watchGroup([ //TODO: Refactor: use service and session store if need
            '$ctrl.fastSearch.testSuite',
            '$ctrl.fastSearch.executionURL',
            '$ctrl.fastSearch.appVersion',
            '$ctrl.searchParams.status',
            '$ctrl.searchParams.environment',
            '$ctrl.searchParams.platform',
            '$ctrl.searchParams.reviewed',
            '$ctrl.selectedRange.dateStart',
            '$ctrl.selectedRange.dateEnd'], function(fastSearchArray) {
            const notEmptyValues = fastSearchArray.filter(function(value) {
                return value && (value.length > 0 ||
                    Object.prototype.toString.call(value) === '[object Date]' ||
                    value.$$hashKey || value === true);
            });

            vm.searchFormIsEmpty = !notEmptyValues.length;
        });

        return vm;

        function init() {
            populateSearchQuery();
            vm.filterBlockExpand = true;
            vm.fastSearchBlockExpand = true;
            loadFilters();
            loadPublicFilters();
            loadSlackMappings();
            storeSlackAvailability();
        }

        function isTestRunsEmpty() {
            return vm.testRuns && !vm.testRuns.length;
        }

        function populateSearchQuery() {
            const searchParams = $location.search();

            console.log(searchParams);

            if (searchParams.testSuite) {
                vm.searchParams.testSuite = searchParams.testSuite;
            }
            if (searchParams.platform) {
                vm.searchParams.platform = searchParams.platform;
            }
            if (searchParams.environment) {
                vm.searchParams.environment = searchParams.environment;
            }
            if (searchParams.page) {
                vm.searchParams.page = searchParams.page;
            }
            if (searchParams.pageSize) {
                vm.searchParams.pageSize = searchParams.pageSize;
            }
            if (searchParams.fromDate) {
                vm.searchParams.fromDateString = searchParams.fromDate;
            }
            if (searchParams.toDate) {
                vm.searchParams.toDateString = searchParams.toDate;
            }
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

        function matchMode(modes) {
            const modesData = getMode();
            const isMode = modesData.filter(function(m) {
                return modes.indexOf(m) !== -1;
            }).length > 0;

            return isMode ||
                (!isMode && modes.indexOf('ANY') !== -1 && modesData.length);
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

        function getTestRuns(page, pageSize) {
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

        //TODO: what the meaning?
        function fillFastSearchParam(params) {
            angular.forEach(vm.fastSearch, function(val, model) {
                if (model !== 'currentModel') {
                    params[model] = val;
                }
            });
        }

        function fillDateParam(params) {
            if (vm.selectedRange.dateStart && vm.selectedRange.dateEnd) {
                if (vm.selectedRange.dateStart.getTime() !==
                    vm.selectedRange.dateEnd.getTime()) {
                    params.fromDate = vm.selectedRange.dateStart;
                    params.toDate = vm.selectedRange.dateEnd;
                } else {
                    params.date = vm.selectedRange.dateStart;
                }
            }
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

        function loadPublicFilters() {
            FilterService.getAllPublicFilters().then(function (rs) {
                if(rs.success) {
                    vm.filters = rs.data;
                }
            });
        }

        function clearAndOpenFilterBlock(value) {
            clearFilter();
            vm.collapseFilter = value;
        }

        function clearFilter() {
            vm.filter = angular.copy(DEFAULT_FILTER_VALUE);
            clearFilterSlice();
        }

        function clearFilterSlice() {
            vm.currentCriteria = angular.copy(CURRENT_CRITERIA);
            vm.currentOperator = angular.copy(CURRENT_OPERATOR);
            vm.currentValue = angular.copy(CURRENT_VALUE);
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

        function searchByFilter(filter, chipsCtrl) {
            if (vm.selectedFilterId === filter.id) { return; } //TODO: check

            vm.selectedFilterId = filter.id;
            vm.chipsCtrl = chipsCtrl;
            getTestRuns();
        }

        function chooseFilter(filter) {
            vm.collapseFilter = true;
            vm.filter = angular.copy(filter);
        }

        function onFilterSliceUpdate(slice) {
            clearFilterCriterias(slice);
            switch(slice) {
                case 'CRITERIA':
                    if(isSelectCriteria(vm.currentCriteria.value)) {
                        vm.currentCriteria.type.push('SELECT');
                    }
                    if(isDateCriteria(vm.currentCriteria.value)) {
                        vm.currentCriteria.type.push('DATE');
                    }
                    break;
                case 'OPERATOR':
                    if(isDateCriteria(vm.currentCriteria.value) && isDatePickerOperator(vm.currentOperator.value)) {
                        vm.currentOperator.type.push('DATE');
                    }
                    break;
                case 'VALUE':
                    break;
                default:
                    break;
            }
        }

        function clearFilterCriterias(slice) {
            switch(slice) {
                case 'CRITERIA':
                    vm.currentOperator = angular.copy(CURRENT_OPERATOR);
                    vm.currentCriteria.type = [];
                case 'OPERATOR':
                    vm.currentValue = angular.copy(CURRENT_VALUE);
                    vm.currentOperator.type = [];
                case 'VALUE':
                default:
                    break;
            }
        }

        function isSelectCriteria(criteria) {
            return criteria && SELECT_CRITERIAS.indexOf(criteria.name) >= 0;
        }

        function isDateCriteria(criteria) {
            return criteria && DATE_CRITERIAS.indexOf(criteria.name) >= 0;
        }

        function isDatePickerOperator(operator) {
            return operator && DATE_CRITERIAS_PICKER_OPERATORS.indexOf(operator) >= 0;
        }

        function loadSubjectBuilder() {
            FilterService.getSubjectBuilder(subjectName).then(function (rs) {
                if(rs.success) {
                    console.log(rs);
                    vm.subjectBuilder = rs.data;
                    vm.subjectBuilder.criterias.forEach(function(criteria) {
                        if(isSelectCriteria(criteria)) {
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

        function loadSlackMappings() {
            vm.slackChannels = [];
            SettingsService.getSettingByTool('SLACK').then(function(rs) {
                if (rs.success) {
                    const settings = UtilService.settingsAsMap(rs.data);

                    angular.forEach(settings, function(value, key) {
                        if (key.indexOf('SLACK_NOTIF_CHANNEL_') === 0) {
                            angular.forEach(value.split(';'), function(v) {
                                vm.slackChannels.push(v);
                            });
                        }
                    });
                } else {
                    alertify.error(rs.message);
                }
            });
        }

        function storeSlackAvailability() {
            vm.isSlackAvailable = false;
            ConfigService.getConfig("slack").then(function successCallback(rs) {
                vm.isSlackAvailable = rs.data.available;
            });
        }

        function getLengthOfSelectedTestRuns() {
            let count = 0;

            for(const id in vm.selectedTestRuns) {
                if (vm.selectedTestRuns.hasOwnProperty(id)) {
                    count += 1;
                }
            }

            return count;
        }

        function areTestRunsFromOneSuite() {
            let testSuiteId;

            for (const testRunId in vm.selectedTestRuns) {
                const selectedTestRun = vm.selectedTestRuns[testRunId];

                if (!testSuiteId) {
                    testSuiteId = selectedTestRun.testSuite.id;
                }
                if (selectedTestRun.testSuite.id !== testSuiteId) {
                    return false;
                }
            }

            return true;
        }

        function showCompareDialog(event) {
            $mdDialog.show({
                controller: 'CompareController',
                templateUrl: 'app/components/modals/compare/compare.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose:true,
                fullscreen: true,
                locals: {
                    selectedTestRuns: vm.selectedTestRuns
                }
            });
        }

        function batchRerun() {
            const rerunFailures = confirm('Would you like to rerun only failures, otherwise all the tests will be restarted?');

            vm.selectAll = false;
            for (const id in vm.testRuns) {
                if (vm.testRuns[id].selected) {
                    vm.rebuild(vm.testRuns[id], rerunFailures);
                }
            }
        }

        function batchDelete() {
            const results = [];
            const errors = [];
            const keys = Object.keys(vm.testRuns);
            const keysToDelete = keys.filter(function (key) {
                return vm.testRuns[key].selected;
            });

            vm.selectAll = false;
            keysToDelete.forEach(function (key) {
                vm.deleteTestRun(vm.testRuns[key].id, true).then(function (rs) {
                    showDeleteMessage(rs, keysToDelete, results, errors);
                });
            });
        }

        function showDeleteMessage(rs, keysToDelete, results, errors) {
            let message;

            if (rs.success) {
                results.push(rs);
            } else {
                errors.push(rs);
            }

            message = buildMessage(keysToDelete, results, errors);
            if(message.message) {
                alertify.success(message.message);
            } else if(message.errorMessage) {
                alertify.error(message.errorMessage);
            }
        }

        function buildMessage(keysToDelete, results, errors) {
            const result = {};

            if (keysToDelete.length === results.length + errors.length) {
                if (results.length) {
                    let message = results.length ? results[0].message : '';
                    let ids = '';

                    results.forEach(function(result, index) {
                        ids = ids + '#' + result.id;
                        if (index !== results.length - 1) {
                            ids += ', ';
                        }
                    });
                    message = message.format(results.length > 1 ? 's' : ' ', ids);
                    result.message = message;
                }
                if (errors.length) {
                    let errorIds = '';
                    let errorMessage = errors.length ? errors[0].message : '';

                    errors.forEach(function(result, index) {
                        errorIds = errorIds + '#' + result.id;
                        if (index !== errors.length - 1) {
                            errorIds += ', ';
                        }
                    });
                    errorMessage = errorMessage.format(errors.length > 1 ? 's' : ' ', errorIds);
                    result.errorMessage = errorMessage;
                }
            }

            return result;
        }

        function abortSelectedTestRuns() {
            if (vm.jenkins.enabled) {
                for (const id in vm.selectedTestRuns) {
                    if (vm.selectedTestRuns[id].status === 'IN_PROGRESS') {
                        abort(vm.selectedTestRuns[id]);
                    }
                }
            } else {
                alertify.error('Unable connect to jenkins');
            }
        }

        function abort(testRun) {
            if (vm.jenkins.enabled) {
                TestRunService.abortCIJob(testRun.id, testRun.ciRunId).then(function (rs) {
                    if(rs.success) {
                        const abortCause = {};

                        abortCause.comment = 'Aborted by ' + $rootScope.currentUser.username;
                        TestRunService.abortTestRun(testRun.id, testRun.ciRunId, abortCause).then(function(rs) {
                            if(rs.success){
                                testRun.status = 'ABORTED';
                                alertify.success('Testrun ' + testRun.testSuite.name + ' is aborted' );
                            } else {
                                alertify.error(rs.message);
                            }
                        });
                    }
                    else {
                        alertify.error(rs.message);
                    }
                });
            } else {
                alertify.error('Unable connect to jenkins');
            }
        }

        function batchEmail(event) {
            const testRuns = [];

            vm.selectAll = false;
            for (const id in vm.testRuns) {
                if (vm.testRuns[id].selected) {
                    testRuns.push(vm.testRuns[id]);
                }
            }
            showEmailDialog(testRuns, event);
        }

        function showEmailDialog(testRuns, event) {
            $mdDialog.show({
                controller: 'EmailController',
                templateUrl: 'app/components/modals/email/email.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose:true,
                fullscreen: true,
                locals: {
                    testRuns: testRuns
                }
            });
        }

        function showDetailsDialog(test, event) {
            vm.isNewIssue = true;
            vm.isNewTask = true;
            test.workItems && setWorkItemIsNewStatus(test.workItems);
            $mdDialog.show({
                controller: 'TestInfoController',
                templateUrl: 'app/components/modal/test-info/test-info.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose:true,
                fullscreen: true,
                locals: {
                    test: test,
                    isNewIssue: vm.isNewIssue,
                    isNewTask: vm.isNewTask,
                    isConnectedToJira: vm.tools['JIRA'],
                    isJiraEnabled: vm.jira.enabled
                }
            })
            .then(undefined, function(response) {
                if (response) {
                    vm.testRuns[test.testRunId].tests[test.id] = angular.copy(response);
                }
            });
        }

        function setWorkItemIsNewStatus(workItems){
            workItems.forEach(function(item) {
                switch (item.type) {
                    case "TASK":
                        vm.isNewTask = false;
                        break;
                    case "BUG":
                        vm.isNewIssue = false;
                        break;
                }
            });
        }

        function addChip() {
            vm.filter.subject.criterias.push({
                name: vm.currentCriteria.value.name,
                operator: vm.currentOperator.value,
                value: vm.currentValue.value && vm.currentValue.value.value ? vm.currentValue.value.value : vm.currentValue.value
            });
            clearFilterSlice();
        }

        function changeChip(chip, index) {
            const criteria = vm.filter.subject.criterias[index];

            criteria.value = chip.value;

            return criteria;
        }

        function onChangeCriteria() {
            for (const criteria in vm.searchParams) {
                if (!vm.searchParams[criteria] || !vm.searchParams[criteria].length) {
                    delete vm.searchParams[criteria];
                }
            }

            $location.search(vm.searchParams);
        }

        function isEqualDate() {
            if (vm.selectedRange.dateStart && vm.selectedRange.dateEnd){
                return vm.selectedRange.dateStart.getTime() === vm.selectedRange.dateEnd.getTime();
            }
        }

        function pick($event, showTemplate) {
            vm.selectedRange.showTemplate = showTemplate;

            $mdDateRangePicker.show({
                targetEvent: $event,
                model: vm.selectedRange
            })
            .then(function(result) {
                if (result) {
                    vm.selectedRange = result;
                }
            })
        }

        function addToSelectedTestRuns(testRun) {
            $timeout(function () {
                if(testRun.selected) {
                    vm.selectedTestRuns[testRun.id] = testRun;
                } else {
                    delete vm.selectedTestRuns[testRun.id];
                }
            }, 100);
        }


    }
})();
