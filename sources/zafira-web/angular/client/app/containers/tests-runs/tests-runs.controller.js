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
        };

        vm.$onInit = function() {
            // console.log(vm.testRuns);
            init();
        };

        $scope.$watchGroup([ //TODO: Refactor: use service and session store
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

            //TODO: what the meaning?
            $scope.search_filter;

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

        function showCompareDialog(event) { //TODO: create modal component
            $mdDialog.show({
                controller: "CompareController",
                templateUrl: 'app/_testruns/compare_modal.html',
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

        function showEmailDialog(testRuns, event) { //TODO: create component
            $mdDialog.show({
                controller: 'EmailController',
                templateUrl: 'app/_testruns/email_modal.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose:true,
                fullscreen: true,
                locals: {
                    testRuns: testRuns
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
            console.log(2222);
            $timeout(function () {
                if(testRun.selected) {
                    vm.selectedTestRuns[testRun.id] = testRun;
                } else {
                    delete vm.selectedTestRuns[testRun.id];
                }
            }, 100);
        }


    }

    /**
     * 
     * ******************************
     * 
     * Controllers:
     * 
     * ******************************
     * 
     */





    // *** Modals Controllers ***
    // function BuildNowController($scope, $mdDialog, TestRunService, testRun) {
    //     $scope.title = testRun.testSuite.name;
    //     $scope.textRequired = false;
    //
    //     $scope.testRun = testRun;
    //
    //     $scope.buildNow = function () {
    //         $scope.hide();
    //         var jobParametersMap = {};
    //         for (var i = 0; i < $scope.jobParameters.length; i++){
    //             jobParametersMap[$scope.jobParameters[i].name] = $scope.jobParameters[i].value;
    //         }
    //         TestRunService.buildTestRun($scope.testRun.id, jobParametersMap).then(function(rs) {
    //             if(rs.success)
    //             {
    //                 alertify.success('CI job is building, it may take some time before status is updated');
    //             }
    //             else
    //             {
    //                 alertify.error(rs.message);
    //             }
    //         });
    //     };
    //     $scope.jobParameters = [];
    //     $scope.isJobParametersLoaded = false;
    //     $scope.noValidJob = false;
    //     $scope.getJobParameters = function () {
    //         TestRunService.getJobParameters($scope.testRun.id).then(function(rs) {
    //             if(rs.success)
    //             {
    //                 $scope.jobParameters = rs.data;
    //                 for (var i = 0; i < $scope.jobParameters.length; i++){
    //                     if ($scope.jobParameters[i].parameterClass === 'BOOLEAN'){
    //                         $scope.jobParameters[i].value = JSON.parse($scope.jobParameters[i].value);
    //                         if ($scope.jobParameters[i].name === "rerun_failures"){
    //                             $scope.jobParameters[i].value = false;
    //                         }
    //                         if ($scope.jobParameters[i].name === "debug"){
    //                             $scope.jobParameters[i].value = false;
    //                         }
    //
    //                     }
    //                 }
    //                 $scope.isJobParametersLoaded = true;
    //                 $scope.noValidJob = $scope.jobParameters == '';
    //             }
    //             else
    //             {
    //                 $scope.hide();
    //                 alertify.error(rs.message);
    //             }
    //         });
    //     };
    //     $scope.hide = function() {
    //         $mdDialog.hide();
    //     };
    //     $scope.cancel = function() {
    //         $mdDialog.cancel();
    //     };
    //     (function initController() {
    //         $scope.getJobParameters();
    //     })();
    // }
    //

    //
    // function SpreadsheetController($scope, $mdDialog, $mdConstant, UserService, TestRunService, testRuns) {
    //
    //     $scope.recipients = [];
    //     $scope.users = [];
    //     $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.TAB, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SPACE, $mdConstant.KEY_CODE.SEMICOLON];
    //
    //     $scope.createSpreadsheet = function () {
    //         $scope.recipients = $scope.recipients.length ? $scope.recipients.toString() : [];
    //         $scope.links = [];
    //
    //         testRuns.forEach(function(testRun) {
    //             TestRunService.createTestRunResultsSpreadsheet(testRun.id, $scope.recipients).then(function(rs) {
    //                 if(rs.success)
    //                 {
    //                     $scope.links.push(rs.data);
    //                     $scope.cancel($scope.links);
    //                 }
    //                 else
    //                 {
    //                     alertify.error(rs.message);
    //                 }
    //             });
    //         });
    //     };
    //     $scope.users_all = [];
    //     var currentText;
    //
    //     $scope.usersSearchCriteria = {};
    //     $scope.asyncContacts = [];
    //     $scope.filterSelected = true;
    //
    //     $scope.querySearch = querySearch;
    //     var stopCriteria = '########';
    //     function querySearch (criteria, user) {
    //         $scope.usersSearchCriteria.email = criteria;
    //         currentText = criteria;
    //         if(!criteria.includes(stopCriteria)) {
    //             stopCriteria = '########';
    //             return UserService.searchUsersWithQuery($scope.usersSearchCriteria, criteria).then(function(rs) {
    //                 if(rs.success)
    //                 {
    //                     if (! rs.data.results.length) {
    //                         stopCriteria = criteria;
    //                     }
    //                     return rs.data.results.filter(searchFilter(user));
    //                 }
    //                 else
    //                 {
    //                     alertify.error(rs.message);
    //                 }
    //             });
    //         }
    //         return "";
    //     }
    //
    //     function searchFilter(u) {
    //         return function filterFn(user) {
    //             var users = u;
    //             for(var i = 0; i < users.length; i++) {
    //                 if(users[i].id == user.id) {
    //                     return false;
    //                 }
    //             }
    //             return true;
    //         };
    //     }
    //
    //     $scope.checkAndTransformRecipient = function (currentUser) {
    //         var user = {};
    //         if (currentUser.username) {
    //             user = currentUser;
    //             $scope.recipients.push(currentUser.email);
    //             $scope.users.push(user);
    //         } else {
    //             user.email = currentUser;
    //             $scope.recipients.push(user.email);
    //             $scope.users.push(user);
    //         }
    //         return user;
    //     };
    //     $scope.removeRecipient = function (user) {
    //         var index = $scope.recipients.indexOf(user.email);
    //         if (index >= 0) {
    //             $scope.recipients.splice(index, 1);
    //         }
    //     };
    //     $scope.hide = function() {
    //         $mdDialog.hide();
    //     };
    //     $scope.cancel = function(links) {
    //         $mdDialog.cancel(links);
    //     };
    //     (function initController() {
    //
    //     })();
    // }
    //
    // function CommentsController($scope, $mdDialog, TestRunService, SlackService, testRun, isSlackAvailable, slackChannels) {
    //     $scope.title = testRun.testSuite.name;
    //     $scope.testRun = angular.copy(testRun);
    //
    //     $scope.markReviewed = function(){
    //         var rq = {};
    //         rq.comment = $scope.testRun.comments;
    //         if((rq.comment == null || rq.comment == "") && ((testRun.failed > 0 && testRun.failed > testRun.failedAsKnown) || testRun.skipped > 0))
    //         {
    //             alertify.error('Unable to mark as Reviewed test run with failed/skipped tests without leaving some comment!');
    //         }
    //         else
    //         {
    //             TestRunService.markTestRunAsReviewed($scope.testRun.id, rq).then(function(rs) {
    //                 if(rs.success)
    //                 {
    //                     $scope.testRun.reviewed = true;
    //                     $scope.hide($scope.testRun);
    //                     alertify.success('Test run #' + $scope.testRun.id + ' marked as reviewed');
    //                     if(isSlackAvailable && slackChannels.indexOf(testRun.job.name) !== -1) {
    //                         if(confirm("Would you like to post latest test run status to slack?"))
    //                         {
    //                             SlackService.triggerReviewNotif($scope.testRun.id);
    //                         }
    //                     }
    //                 }
    //                 else
    //                 {
    //                     alertify.error(rs.message);
    //                 }
    //             });
    //         }
    //     };
    //     $scope.hide = function(testRun) {
    //         $mdDialog.hide(testRun);
    //     };
    //     $scope.cancel = function() {
    //         $mdDialog.cancel();
    //     };
    //     (function initController() {
    //
    //     })();
    // }
    //
    // function TestRunRerunController($scope, $mdDialog, TestRunService, testRun, jenkins) {
    //
    //     $scope.rerunFailures = true;
    //     $scope.testRun = testRun;
    //
    //     $scope.rebuild = function (testRun, rerunFailures) {
    //         if (jenkins.enabled) {
    //             TestRunService.rerunTestRun(testRun.id, rerunFailures).then(function(rs) {
    //                 if(rs.success)
    //                 {
    //                     testRun.status = 'IN_PROGRESS';
    //                     alertify.success("Rebuild triggered in CI service");
    //                 }
    //                 else
    //                 {
    //                     alertify.error(rs.message);
    //                 }
    //             });
    //         }
    //         else {
    //             window.open(testRun.jenkinsURL + '/rebuild/parameterized', '_blank');
    //         }
    //         $scope.hide(true);
    //     };
    //
    //     $scope.hide = function() {
    //         $mdDialog.hide();
    //     };
    //     $scope.cancel = function() {
    //         $mdDialog.cancel();
    //     };
    //
    //     (function initController() {
    //     })();
    // }
    //
    // function DemoController($scope, $mdDialog, $timeout, $window, UtilService, wsURL, rabbitmq, testRun, test, isLive) {
    //
    //     var rfb;
    //     var display;
    //     var ratio;
    //
    //     $scope.loading = true;
    //
    //     $scope.initVNCWebsocket = function() {
    //         rfb = new RFB(angular.element('#vnc')[0], wsURL, { shared: true, credentials: { password: 'selenoid' } });
    //         //rfb._viewOnly = true;
    //         rfb.addEventListener("connect",  connected);
    //         rfb.addEventListener("disconnect",  disconnected);
    //         rfb.scaleViewport = true;
    //         rfb.resizeSession = true;
    //         display = rfb._display;
    //         display._scale = 1;
    //         angular.element($window).bind('resize', function(){
    //             autoscale(display, ratio, angular.element($window)[0]);
    //         });
    //     };
    //
    //     function connected(e) {
    //         $scope.loading = false;
    //         var canvas = document.getElementsByTagName("canvas")[0];
    //         ratio = canvas.width / canvas.height;
    //         autoscale(display, ratio, angular.element($window)[0]);
    //
    //     };
    //
    //     function disconnected(e) {
    //         $scope.hide();
    //     };
    //
    //     function autoscale(display, ratio, window) {
    //         var size = calculateSize(window, ratio);
    //         display.autoscale(size.width, size.height, false);
    //     };
    //
    //     function calculateSize(window, ratio) {
    //         var width = window.innerWidth * 0.9;
    //         var height = ratio > 1 ?  width / ratio : width * ratio;
    //         if(height > window.innerHeight * 0.9)
    //         {
    //             height = window.innerHeight - 100;
    //             width = ratio < 1 ? height / ratio : height * ratio;
    //         }
    //         return {height: height, width: width};
    //     };
    //
    //     $scope.$on('$destroy', function () {
    //         if(rfb) {
    //             rfb.disconnect();
    //         }
    //         $scope.testLogsStomp.disconnect();
    //         $scope.logs = [];
    //         UtilService.websocketConnected('logs');
    //     });
    //
    //     $scope.hide = function() {
    //         $mdDialog.hide();
    //     };
    //
    //     $scope.cancel = function() {
    //         $mdDialog.cancel();
    //     };
    //
    //     $scope.testLogsStomp = null;
    //     $scope.logs = [];
    //
    //     $scope.initLogsWebsocket = function () {
    //         if(rabbitmq.enabled)
    //         {
    //             var wsName = 'logs';
    //             $scope.testLogsStomp = Stomp.over(new SockJS(rabbitmq.ws));
    //             $scope.testLogsStomp.debug = null;
    //             $scope.testLogsStomp.connect(rabbitmq.user, rabbitmq.pass, function () {
    //                 $scope.logs = [];
    //
    //                 UtilService.websocketConnected(wsName);
    //
    //                 $scope.$watch('logs', function (logs) {
    //                     var scroll = document.getElementsByClassName("log-demo")[0];
    //                     scroll.scrollTop = scroll.scrollHeight;
    //                 }, true);
    //
    //                 $scope.testLogsStomp.subscribe("/exchange/logs/" + testRun.ciRunId, function (data) {
    //                     if((test != null && (testRun.ciRunId + "_" + test.id) == data.headers['correlation-id'])
    //                         || (test == null && data.headers['correlation-id'].startsWith(testRun.ciRunId)))
    //                     {
    //                         var log = JSON.parse(data.body.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    //                         $scope.logs.push({'level': log.level, 'message': log.message, 'timestamp': log.timestamp});
    //                         $scope.$apply();
    //                     }
    //                 });
    //             }, function () {
    //                 UtilService.reconnectWebsocket(wsName, $scope.initLogsWebsocket);
    //             });
    //         }
    //     };
    //
    //     (function initController() {
    //         if(isLive) {
    //             $scope.title = 'Live video';
    //             $timeout(function () {
    //                 $scope.initVNCWebsocket();
    //             }, 200);
    //             $scope.initLogsWebsocket();
    //         } else {
    //             $scope.wsURL = wsURL;
    //             $scope.title = 'Video';
    //             $timeout(function () {
    //                 var container = document.getElementsByTagName('video')[0];
    //                 var containerRectangle = container.getBoundingClientRect();
    //                 var ratio = containerRectangle.width / (containerRectangle.height + 20);
    //                 $scope.videoWidth = calculateSize(angular.element($window)[0], ratio).width;
    //                 angular.element($window).bind('resize', function() {
    //                     $scope.videoWidth = calculateSize(angular.element($window)[0], ratio).width;
    //                 });
    //             }, 200);
    //         }
    //     })();
    // };
    //
    // function LogsController($scope, $mdDialog, $interval, UtilService, rabbitmq, testRun, test) {
    //
    //     $scope.testLogsStomp = null;
    //     $scope.logs = [];
    //     $scope.loading = true;
    //
    //     $scope.$on('$destroy', function() {
    //         if($scope.testLogsStomp && $scope.testLogsStomp.connected) {
    //             $scope.testLogsStomp.disconnect();
    //             $scope.logs = [];
    //             UtilService.websocketConnected('logs');
    //         }
    //     });
    //
    //     $scope.hide = function() {
    //         $mdDialog.hide();
    //     };
    //     $scope.cancel = function() {
    //         $mdDialog.cancel();
    //     };
    //
    //     $scope.initLogsWebsocket = function () {
    //         if(rabbitmq.enabled)
    //         {
    //             var wsName = 'logs';
    //             $scope.testLogsStomp = Stomp.over(new SockJS(rabbitmq.ws));
    //             $scope.testLogsStomp.debug = null;
    //             $scope.testLogsStomp.connect(rabbitmq.user, rabbitmq.pass, function () {
    //                 $scope.logs = [];
    //
    //                 UtilService.websocketConnected(wsName);
    //
    //                 $scope.$watch('logs', function (logs) {
    //                     var scroll = document.getElementsByTagName("md-dialog-content")[0];
    //                     scroll.scrollTop = scroll.scrollHeight;
    //                 }, true);
    //
    //                 $scope.testLogsStomp.subscribe("/exchange/logs/" + testRun.ciRunId, function (data) {
    //                     if((test != null && (testRun.ciRunId + "_" + test.id) == data.headers['correlation-id'])
    //                         || (test == null && data.headers['correlation-id'].startsWith(testRun.ciRunId)))
    //                     {
    //                         $scope.loading = false;
    //                         var log = JSON.parse(data.body.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    //                         $scope.logs.push({'level': log.level, 'message': log.message, 'timestamp': log.timestamp});
    //                         $scope.$apply();
    //                     }
    //                 });
    //             }, function () {
    //                 UtilService.reconnectWebsocket(wsName, $scope.initLogsWebsocket);
    //             });
    //         }
    //     };
    //
    //     (function initController() {
    //         $scope.initLogsWebsocket();
    //     })();
    // }
    //
    // function CompareController($scope, $mdDialog, $q, $location, TestService, selectedTestRuns) {
    //
    //     $scope.hideIdentical = false;
    //     $scope.allTestsIdentical = true;
    //     $scope.tr = {};
    //     angular.copy(selectedTestRuns, $scope.tr);
    //
    //     var COMPARE_FIELDS = ['status', 'message'];
    //     var EXIST_FIELDS = {'name': '', 'testGroup': '', 'testClass': ''};
    //
    //     function aggregateTests(testRuns) {
    //         return angular.forEach(collectUniqueTests(testRuns), function (test) {
    //             test.identical = areTestsIdentical(test.referrers, testRuns);
    //         });
    //     };
    //
    //     function collectUniqueTests(testRuns) {
    //         var uniqueTests = {};
    //         angular.forEach(testRuns, function(testRun) {
    //             angular.forEach(testRun.tests, function(test) {
    //                 var uniqueTestKey = EXIST_FIELDS;
    //                 uniqueTestKey.name = test.name;
    //                 uniqueTestKey.testGroup = test.testGroup;
    //                 uniqueTestKey.testClass = test.testClass;
    //                 var stringKey = JSON.stringify(uniqueTestKey);
    //                 if(! uniqueTests[stringKey]) {
    //                     uniqueTests[stringKey] = test;
    //                     uniqueTests[stringKey].referrers = {};
    //                 }
    //                 if(!uniqueTests[stringKey].referrers[testRun.id]) {
    //                     uniqueTests[stringKey].referrers[testRun.id] = {};
    //                 }
    //                 uniqueTests[stringKey].referrers[testRun.id] = test.id;
    //             })
    //         });
    //         return uniqueTests;
    //     };
    //
    //     function areTestsIdentical(referrers, testRuns) {
    //         var value = {};
    //         var result = {};
    //         var identicalCount = 'count';
    //         result[identicalCount] = Object.size(referrers) == Object.size(testRuns);
    //         for(var testRunId in referrers) {
    //             var test = testRuns[testRunId].tests[referrers[testRunId]];
    //             if(Object.size(value) == 0) {
    //                 for(var index = 0; index < COMPARE_FIELDS.length; index++) {
    //                     var field = COMPARE_FIELDS[index];
    //                     value[field] = test[field];
    //                     result[field] = true;
    //                 }
    //                 result.isIdentical = true;
    //                 continue;
    //             }
    //             for(var index = 0; index < COMPARE_FIELDS.length; index++) {
    //                 var field = COMPARE_FIELDS[index];
    //                 result[field] = verifyValueWithRegex(field, test[field], value[field]);
    //                 if(result[field] == false) {
    //                     result.isIdentical = false;
    //                     $scope.allTestsIdentical = false;
    //                 }
    //             }
    //         }
    //         if(! result[identicalCount]) {
    //             $scope.allTestsIdentical = false;
    //         }
    //         return result;
    //     };
    //
    //     function verifyValueWithRegex(field, value1, value2) {
    //         var val1 = field == 'message' && value1 ? value1
    //             .replace(new RegExp("\\d+","gm"), '*')
    //             .replace(new RegExp("\\[.*\\]","gm"), '*')
    //             .replace(new RegExp("\\{.*\\}","gm"), '*')
    //             .replace(new RegExp(".*\\b(Session ID)\\b.*","gm"), '*')
    //             : value1;
    //         var val2 = field == 'message' && value2 ? value2
    //             .replace(new RegExp("\\d+", "gm"), '*')
    //             .replace(new RegExp("\\[.*\\]", "gm"), '*')
    //             .replace(new RegExp("\\{.*\\}", "gm"), '*')
    //             .replace(new RegExp(".*\\b(Session ID)\\b.*", "gm"), '*')
    //             : value2;
    //         return ! isEmpty(value1) && ! isEmpty(value2) ? value1 == value2 : true;
    //     };
    //
    //     function isEmpty(value) {
    //         return ! value || ! value.length;
    //     };
    //
    //     $scope.getSize = function (obj) {
    //         return Object.size(obj);
    //     };
    //
    //     $scope.getTest = function (testUnique, testRun) {
    //         var testId = testUnique.referrers[testRun.id];
    //         return testRun.tests[testId];
    //     };
    //
    //     $scope.initTestRuns = function () {
    //         return $q(function(resolve, reject) {
    //             var index = 0;
    //             var testRunsSize = Object.size($scope.tr);
    //             angular.forEach($scope.tr, function (testRun, testRunId) {
    //                 loadTests(testRunId).then(function (sr) {
    //                     $scope.tr[testRunId].tests = {};
    //                     sr.results.forEach(function(test) {
    //                         $scope.tr[testRunId].tests[test.id] = test;
    //                     });
    //                     index++;
    //                     if(index == testRunsSize) {
    //                         resolve($scope.tr);
    //                     }
    //                 });
    //             });
    //         })
    //     };
    //
    //     function loadTests(testRunId) {
    //         return $q(function(resolve, reject) {
    //             var testSearchCriteria = {
    //                 'page': 1,
    //                 'pageSize': 100000,
    //                 'testRunId': testRunId
    //             };
    //             TestService.searchTests(testSearchCriteria).then(function (rs) {
    //                 if (rs.success) {
    //                     resolve(angular.copy(rs.data));
    //                 }
    //                 else {
    //                     reject(rs.message);
    //                     console.error(rs.message);
    //                 }
    //             });
    //         })
    //     };
    //
    //     $scope.openTestRun = function (testRunId) {
    //         if ($location.$$path != $location.$$url){
    //             $location.search({});
    //         }
    //         if ($location.$$absUrl.match(new RegExp(testRunId, 'gi')) == null){
    //             window.open($location.$$absUrl + "/" + testRunId, '_blank');
    //         }
    //     };
    //
    //     $scope.hide = function() {
    //         $mdDialog.hide();
    //     };
    //     $scope.cancel = function() {
    //         $mdDialog.cancel();
    //     };
    //
    //     (function initController() {
    //         $scope.loading = true;
    //         $scope.initTestRuns().then(function (testRuns) {
    //             $scope.loading = false;
    //             $scope.uniqueTests = aggregateTests(testRuns);
    //         });
    //     })();
    // }
    //
    // function DetailsController($scope, $rootScope, $mdDialog, $interval,  SettingsService, TestService, test, isNewIssue, isNewTask, isConnectedToJira, isJiraEnabled) {
    //
    //     $scope.jiraId;
    //     $scope.isConnectedToJira = false;
    //
    //     $scope.issueJiraIdExists = true;
    //     $scope.taskJiraIdExists = true;
    //
    //     $scope.issueTabDisabled = true;
    //     $scope.taskTabDisabled = true;
    //
    //     $scope.isIssueFound = true;
    //     $scope.isTaskFound = true;
    //
    //     $scope.isIssueClosed = false;
    //
    //     $scope.test = angular.copy(test);
    //     $scope.testCommentText = '';
    //     $scope.testComments = [];
    //     $scope.issues = [];
    //     $scope.tasks = [];
    //     $scope.currentStatus = $scope.test.status;
    //     $scope.testStatuses = ['PASSED', 'FAILED', 'SKIPPED', 'ABORTED'];
    //     $scope.ticketStatuses = ['TO DO', 'OPEN', 'NOT ASSIGNED', 'IN PROGRESS', 'FIXED', 'REOPENED', 'DUPLICATE'];
    //
    //     $scope.selectedTabIndex = 0;
    //
    //     $scope.issueStatusIsNotRecognized = false;
    //     $scope.changeStatusIsVisible = false;
    //     $scope.taskListIsVisible = false;
    //     $scope.issueListIsVisible = false;
    //
    //     /* TEST_STATUS functionality */
    //
    //     $scope.updateTest = function (test) {
    //         var message;
    //         TestService.updateTest(test).then(function(rs) {
    //             if(rs.success) {
    //                 $scope.changeStatusIsVisible = false;
    //                 message = 'Test was marked as ' + test.status;
    //                 addTestEvent(message);
    //                 alertify.success(message);
    //             }
    //             else {
    //                 console.error(rs.message);
    //             }
    //         });
    //     };
    //
    //     $scope.moveToTab = function (tabIndex) {
    //         $scope.selectedTabIndex = tabIndex;
    //     };
    //
    //     /** UI methods for handling actions with ISSUE / TASK */
    //
    //     /* Updates list of workitems on UI */
    //
    //     var updateWorkItemList = function (workItem){
    //         switch (workItem.type){
    //             case 'BUG':
    //                 var issues = $scope.issues;
    //                 for (var i = 0; i < issues.length; i++) {
    //                     if (issues[i].jiraId === workItem.jiraId) {
    //                         deleteWorkItemFromList(issues[i]);
    //                         break;
    //                     }
    //                 }
    //                 $scope.issues.push(workItem);
    //                 break;
    //             case 'TASK':
    //                 var tasks = $scope.tasks;
    //                 for (var j = 0; j < tasks.length; j++) {
    //                     if (tasks[j].jiraId === workItem.jiraId) {
    //                         deleteWorkItemFromList(tasks[j]);
    //                         break;
    //                     }
    //                 }
    //                 $scope.tasks.push(workItem);
    //         }
    //         $scope.test.workItems.push(workItem);
    //     };
    //
    //     /* Deletes workitem from list of workitems on UI */
    //
    //     var deleteWorkItemFromList = function (workItem){
    //         switch (workItem.type){
    //             case 'BUG':
    //                 var issueToDelete =  $scope.issues.filter(function (listWorkItem) {
    //                     return listWorkItem.jiraId === workItem.jiraId;
    //                 })[0];
    //                 var issueIndex = $scope.issues.indexOf(issueToDelete);
    //                 if (issueIndex !== -1) {
    //                     $scope.issues.splice(issueIndex, 1);
    //                 }
    //                 break;
    //             case 'TASK':
    //                 var taskToDelete =  $scope.tasks.filter(function (listWorkItem) {
    //                     return listWorkItem.jiraId === workItem.jiraId;
    //                 })[0];
    //                 var taskIndex = $scope.tasks.indexOf(taskToDelete);
    //                 if (taskIndex !== -1) {
    //                     $scope.tasks.splice(taskIndex, 1);
    //                 }
    //                 break;
    //         }
    //         deleteWorkItemFromTestWorkItems(workItem);
    //     };
    //
    //     /* Deletes workitem from list of workitems in test object */
    //
    //     var deleteWorkItemFromTestWorkItems = function (workItem) {
    //         var issueToDelete =  $scope.test.workItems.filter(function (listWorkItem) {
    //             return listWorkItem.jiraId === workItem.jiraId;
    //         })[0];
    //         var workItemIndex = $scope.test.workItems.indexOf(issueToDelete);
    //         if (workItemIndex !== -1) {
    //             $scope.test.workItems.splice(workItemIndex, 1);
    //         }
    //     };
    //
    //     /***/
    //
    //     /** ISSUE / TASK functionality */
    //
    //     var taskJiraIdInputIsChanged = false;
    //     var issueJiraIdInputIsChanged = false;
    //
    //     /* Assigns issue to the test */
    //
    //     $scope.assignIssue = function (issue) {
    //         if(!issue.testCaseId){
    //             issue.testCaseId = test.testCaseId;
    //         }
    //         TestService.createTestWorkItem(test.id, issue).then(function(rs) {
    //             var workItemType = issue.type;
    //             var jiraId = issue.jiraId;
    //             var message;
    //             if(rs.success) {
    //                 if($scope.isNewIssue) {
    //                     message = generateActionResultMessage(workItemType, jiraId, "assign" + "e", true);
    //                 } else {
    //                     message = generateActionResultMessage(workItemType, jiraId, "update", true);
    //                 }
    //                 addTestEvent(message);
    //                 $scope.newIssue.id = rs.data.id;
    //                 updateWorkItemList(rs.data);
    //                 initAttachedWorkItems();
    //                 $scope.isNewIssue = !(jiraId === $scope.attachedIssue.jiraId);
    //                 alertify.success(message);
    //             }
    //             else {
    //                 if($scope.isNewIssue){
    //                     message = generateActionResultMessage(workItemType, jiraId, "assign", false);
    //                 } else {
    //                     message = generateActionResultMessage(workItemType, jiraId, "update", false);
    //                 }
    //                 alertify.error(message);
    //             }
    //         });
    //     };
    //
    //     /* Assigns task to the test */
    //
    //     $scope.assignTask = function (task) {
    //         if(!task.testCaseId){
    //             task.testCaseId = test.testCaseId;
    //         }
    //         TestService.createTestWorkItem(test.id, task).then(function(rs) {
    //             var workItemType = task.type;
    //             var jiraId = task.jiraId;
    //             var message;
    //             if(rs.success) {
    //                 if($scope.isNewTask) {
    //                     message = generateActionResultMessage(workItemType, jiraId, "assign" + "e", true);
    //                 } else {
    //                     message = generateActionResultMessage(workItemType, jiraId, "update", true);
    //                 }
    //                 addTestEvent(message);
    //                 $scope.newTask.id = rs.data.id;
    //                 updateWorkItemList(rs.data);
    //                 initAttachedWorkItems();
    //                 $scope.isNewTask = !(jiraId === $scope.attachedTask.jiraId);
    //                 alertify.success(message);
    //             }
    //             else {
    //                 if($scope.isNewTask){
    //                     message = generateActionResultMessage(workItemType, jiraId, "assign", false);
    //                 } else {
    //                     message = generateActionResultMessage(workItemType, jiraId, "update", false);
    //                 }
    //                 alertify.error(message);
    //             }
    //         });
    //     };
    //
    //     /* Unassignes issue from the test */
    //
    //     $scope.unassignIssue = function (workItem) {
    //         TestService.deleteTestWorkItem(test.id, workItem.id).then(function(rs) {
    //             var message;
    //             if(rs.success) {
    //                 message = generateActionResultMessage(workItem.type, workItem.jiraId, "unassign" + "e", true);
    //                 addTestEvent(message);
    //                 deleteWorkItemFromTestWorkItems(workItem);
    //                 initAttachedWorkItems();
    //                 initNewIssue();
    //                 alertify.success(message);
    //             } else {
    //                 message = generateActionResultMessage(workItem.type, workItem.jiraId, "unassign", false);
    //                 alertify.error(message);
    //             }
    //         });
    //     };
    //
    //     /* Unassignes task from the test */
    //
    //     $scope.unassignTask = function (workItem) {
    //         TestService.deleteTestWorkItem(test.id, workItem.id).then(function(rs) {
    //             var message;
    //             if(rs.success) {
    //                 message = generateActionResultMessage(workItem.type, workItem.jiraId, "unassign" + "e", true);
    //                 addTestEvent(message);
    //                 deleteWorkItemFromTestWorkItems(workItem);
    //                 initAttachedWorkItems();
    //                 initNewTask();
    //                 alertify.success(message);
    //             } else {
    //                 message = generateActionResultMessage(workItem.type, workItem.jiraId, "unassign", false);
    //                 alertify.error(message);
    //             }
    //         });
    //     };
    //
    //     /* Starts set in the scope issue search */
    //
    //     $scope.searchScopeIssue = function (issue) {
    //         $scope.initIssueSearch();
    //         initAttachedWorkItems();
    //         $scope.isNewIssue = !(issue.jiraId === $scope.attachedIssue.jiraId);
    //         $scope.newIssue.id = issue.id;
    //         $scope.newIssue.jiraId = issue.jiraId;
    //         $scope.newIssue.description = issue.description;
    //     };
    //
    //     /* Starts set in the scope task search */
    //
    //     $scope.searchScopeTask = function (task) {
    //         $scope.initTaskSearch();
    //         initAttachedWorkItems();
    //         $scope.isNewTask = !(task.jiraId === $scope.attachedTask.jiraId);
    //         $scope.newTask.id = task.id;
    //         $scope.newTask.jiraId = task.jiraId;
    //         $scope.newTask.description = task.description;
    //     };
    //
    //     /* Initializes issue object before search */
    //
    //     $scope.initIssueSearch = function () {
    //         issueJiraIdInputIsChanged = true;
    //         $scope.newIssue.description = '';
    //         $scope.newIssue.id = null;
    //         $scope.newIssue.status = null;
    //         $scope.newIssue.assignee = null;
    //         $scope.newIssue.reporter = null;
    //         $scope.issueJiraIdExists = true;
    //         $scope.isIssueClosed = false;
    //         $scope.isIssueFound = false;
    //         $scope.isNewIssue = true;
    //         var existingIssue = $scope.issues.filter(function (foundIssue) {
    //             return foundIssue.jiraId === $scope.newIssue.jiraId;
    //         })[0];
    //         if(existingIssue){
    //             angular.copy(existingIssue, $scope.newIssue);
    //         }
    //     };
    //
    //     /* Initializes task object before search */
    //
    //     $scope.initTaskSearch = function () {
    //         taskJiraIdInputIsChanged = true;
    //         $scope.newTask.description = '';
    //         $scope.newTask.id = null;
    //         $scope.newTask.status = null;
    //         $scope.newTask.assignee = null;
    //         $scope.newTask.reporter = null;
    //         $scope.taskJiraIdExists = true;
    //         $scope.isTaskFound = false;
    //         $scope.isNewTask = true;
    //         var existingTask = $scope.tasks.filter(function (foundTask) {
    //             return foundTask.jiraId === $scope.newTask.jiraId;
    //         })[0];
    //         if(existingTask)
    //             angular.copy(existingTask, $scope.newTask);
    //     };
    //
    //     /* Writes all attached to the test workitems into scope variables.
    //     Used for initialization and reinitialization */
    //
    //     var initAttachedWorkItems = function () {
    //         $scope.testComments = [];
    //         var attachedWorkItem = {};
    //         attachedWorkItem.jiraId = '';
    //         $scope.attachedIssue = attachedWorkItem;
    //         $scope.attachedTask = attachedWorkItem;
    //         var workItems = $scope.test.workItems;
    //         for (var i = 0; i < workItems.length; i++){
    //             switch(workItems[i].type) {
    //                 case 'BUG':
    //                     $scope.attachedIssue = workItems[i];
    //                     break;
    //                 case 'TASK':
    //                     $scope.attachedTask = workItems[i];
    //                     break;
    //                 case 'COMMENT':
    //                     $scope.testComments.push(workItems[i]);
    //                     break;
    //             }
    //         }
    //     };
    //
    //     /* Searches issue in Jira by Jira ID */
    //
    //     var searchIssue = function (issue) {
    //         $scope.isIssueFound = false;
    //         $scope.issueStatusIsNotRecognized = false;
    //         TestService.getJiraTicket(issue.jiraId).then(function(rs) {
    //             if(rs.success) {
    //                 var searchResultIssue = rs.data;
    //                 $scope.isIssueFound = true;
    //                 if (searchResultIssue === '') {
    //                     $scope.isIssueClosed = false;
    //                     $scope.issueJiraIdExists = false;
    //                     $scope.issueTabDisabled = false;
    //                     return;
    //                 }
    //                 $scope.issueJiraIdExists = true;
    //                 $scope.isIssueClosed = $scope.closedStatusName.toUpperCase() === searchResultIssue.status.name.toUpperCase();
    //                 $scope.newIssue.description = searchResultIssue.summary;
    //                 $scope.newIssue.assignee = searchResultIssue.assignee ? searchResultIssue.assignee.name : '';
    //                 $scope.newIssue.reporter = searchResultIssue.reporter.name;
    //                 $scope.newIssue.status = searchResultIssue.status.name.toUpperCase();
    //                 if(!$scope.ticketStatuses.filter(function (status) {
    //                     return status === $scope.newIssue.status;
    //                 })[0]){
    //                     $scope.issueStatusIsNotRecognized = true;
    //                 }
    //                 $scope.isNewIssue = !($scope.newIssue.jiraId === $scope.attachedIssue.jiraId);
    //                 $scope.issueTabDisabled = false;
    //             } else {
    //                 alertify.error(rs.message);
    //             }
    //         });
    //     };
    //
    //     /* Searches task in Jira by Jira ID */
    //
    //     var searchTask = function (task) {
    //         $scope.isTaskFound = false;
    //         TestService.getJiraTicket(task.jiraId).then(function(rs) {
    //             if(rs.success) {
    //                 var searchResultTask = rs.data;
    //                 $scope.isTaskFound = true;
    //                 if (searchResultTask === '') {
    //                     $scope.taskJiraIdExists = false;
    //                     $scope.taskTabDisabled = false;
    //                     return;
    //                 }
    //                 $scope.taskJiraIdExists = true;
    //                 $scope.newTask.description = searchResultTask.summary;
    //                 $scope.newTask.assignee = searchResultTask.assignee.name;
    //                 $scope.newTask.reporter = searchResultTask.reporter.name;
    //                 $scope.newTask.status = searchResultTask.status.name.toUpperCase();
    //                 $scope.isNewTask = !($scope.newTask.jiraId === $scope.attachedTask.jiraId);
    //                 $scope.taskTabDisabled = false;
    //             } else {
    //                 alertify.error(rs.message);
    //             }
    //         });
    //     };
    //
    //     /*  Checks whether conditions for issue search in Jira are fulfilled */
    //
    //     var isIssueSearchAvailable = function (jiraId) {
    //         if ($scope.isConnectedToJira && jiraId){
    //             if ($scope.issueTabDisabled || issueJiraIdInputIsChanged) {
    //                 issueJiraIdInputIsChanged = false;
    //                 return true;
    //             }
    //         } else {
    //             $scope.isIssueFound = true;
    //             return false;
    //         }
    //     };
    //
    //     /*  Checks whether conditions for task search in Jira are fulfilled */
    //
    //     var isTaskSearchAvailable = function (jiraId) {
    //         if ($scope.isConnectedToJira && jiraId){
    //             if ($scope.taskTabDisabled || taskJiraIdInputIsChanged) {
    //                 taskJiraIdInputIsChanged = false;
    //                 return true;
    //             }
    //         } else {
    //             $scope.isTaskFound = true;
    //             return false;
    //         }
    //     };
    //
    //     /* Initializes empty issue */
    //
    //     var initNewIssue = function (isInit) {
    //         if(isInit){
    //             $scope.isNewIssue = isNewIssue;
    //         } else {
    //             $scope.isNewIssue = true;
    //         }
    //         $scope.newIssue = {};
    //         $scope.newIssue.type = "BUG";
    //         $scope.newIssue.testCaseId = test.testCaseId;
    //     };
    //
    //     /* Initializes empty task */
    //
    //     var initNewTask = function (isInit) {
    //         if(isInit){
    //             $scope.isNewTask = isNewTask;
    //         } else {
    //             $scope.isNewTask = true;
    //         }
    //         $scope.newTask = {};
    //         $scope.newTask.type = "TASK";
    //         $scope.newTask.testCaseId = test.testCaseId;
    //     };
    //
    //     /* Gets issues attached to the testcase */
    //
    //     var getIssues = function () {
    //         TestService.getTestCaseWorkItemsByType(test.id, 'BUG').then(function(rs) {
    //             if(rs.success) {
    //                 $scope.issues = rs.data;
    //                 if(test.workItems.length && !$scope.isNewIssue) {
    //                     angular.copy($scope.attachedIssue, $scope.newIssue);
    //                 }
    //             } else {
    //                 alertify.error(rs.message);
    //             }
    //         });
    //     };
    //
    //     /* Gets tasks attached to the testcase */
    //
    //     var getTasks = function () {
    //         TestService.getTestCaseWorkItemsByType(test.id, 'TASK').then(function(rs) {
    //             if(rs.success) {
    //                 $scope.tasks = rs.data;
    //                 if(test.workItems.length && !$scope.isNewTask) {
    //                     angular.copy($scope.attachedTask, $scope.newTask);
    //                 }
    //             } else {
    //                 alertify.error(rs.message);
    //             }
    //         });
    //     };
    //
    //     /* Gets from DB JIRA_CLOSED_STATUS name for the current project*/
    //
    //     var getJiraClosedStatusName = function() {
    //         SettingsService.getSetting('JIRA_CLOSED_STATUS').then(function successCallback(rs) {
    //             if(rs.success){
    //                 $scope.closedStatusName = rs.data.toUpperCase();
    //             } else {
    //                 alertify.error(rs.message);
    //             }
    //         });
    //     };
    //
    //     /* On Jira ID input change makes search if conditions are fulfilled */
    //
    //     var workItemSearchInterval = $interval(function () {
    //         if(issueJiraIdInputIsChanged){
    //             if (isIssueSearchAvailable($scope.newIssue.jiraId)) {
    //                 searchIssue($scope.newIssue);
    //             }
    //         }
    //         if(taskJiraIdInputIsChanged){
    //             if (isTaskSearchAvailable($scope.newTask.jiraId)) {
    //                 searchTask($scope.newTask);
    //             }
    //         }
    //     }, 2000);
    //
    //     /* Closes search interval when the modal is closed */
    //
    //     $scope.$on('$destroy', function() {
    //         if(workItemSearchInterval)
    //             $interval.cancel(workItemSearchInterval);
    //     });
    //
    //     /* Sends request to Jira for issue additional info after opening modal */
    //
    //     var issueOnModalOpenSearch = $interval(function(){
    //         if (angular.element(document.body).hasClass('md-dialog-is-showing')) {
    //             if (!isIssueSearchAvailable($scope.newIssue.jiraId)) {
    //                 $scope.issueTabDisabled = false;
    //             } else {
    //                 searchIssue($scope.newIssue);
    //             }
    //             $interval.cancel(issueOnModalOpenSearch);
    //         }
    //     }, 500);
    //
    //     /* Sends request to Jira for task additional info after opening modal */
    //
    //     var taskOnModalOpenSearch = $interval(function(){
    //         if (angular.element(document.body).hasClass('md-dialog-is-showing')) {
    //             if (!isTaskSearchAvailable($scope.newTask.jiraId)) {
    //                 $scope.taskTabDisabled = false;
    //             } else {
    //                 searchTask($scope.newTask);
    //             }
    //             $interval.cancel(taskOnModalOpenSearch);
    //         }
    //     }, 2500);
    //
    //     /* COMMENT functionality */
    //
    //     /* Adds comment to test (either custom or action-related) */
    //
    //     $scope.addTestComment = function (message){
    //         var testComment = {};
    //         testComment.description = message;
    //         testComment.jiraId = Math.floor(Math.random() * 90000) + 10000;
    //         testComment.testCaseId = test.testCaseId;
    //         testComment.type = 'COMMENT';
    //         var eventMessage = '';
    //         TestService.createTestWorkItem(test.id, testComment).then(function(rs){
    //             if(rs.success) {
    //                 $scope.testComments.push(rs.data);
    //                 eventMessage = generateActionResultMessage(testComment.type, '', 'create', true);
    //                 addTestEvent(eventMessage);
    //                 alertify.success(eventMessage);
    //             } else {
    //                 eventMessage = generateActionResultMessage(testComment.type, '', 'create', false);
    //                 alertify.error('Failed to create comment for test "' + test.id);
    //             }
    //             $scope.testCommentText = '';
    //         })
    //     };
    //
    //     var addTestEvent = function (message){
    //         var testEvent = {};
    //         testEvent.description = message;
    //         testEvent.jiraId = Math.floor(Math.random() * 90000) + 10000;
    //         testEvent.testCaseId = test.testCaseId;
    //         testEvent.type = 'EVENT';
    //         TestService.createTestWorkItem(test.id, testEvent).then(function(rs){
    //             if(rs.success) {
    //             } else {
    //                 alertify.error('Failed to add event test "' + test.id);
    //             }
    //         })
    //     };
    //
    //     /* Generates result message for action comment (needed to be stored into DB and added in UI alert) */
    //
    //     var generateActionResultMessage = function (item, id, action, success) {
    //         if (success) {
    //             return item + " " +  id +" was " + action + "d";
    //         } else {
    //             return "Failed to " + action + " " + item.toLowerCase();
    //         }
    //     };
    //
    //     /* MODAL_WINDOW functionality */
    //
    //     $scope.hide = function() {
    //         $mdDialog.hide(test);
    //     };
    //
    //     $scope.cancel = function() {
    //         $mdDialog.cancel($scope.test);
    //     };
    //
    //     (function initController() {
    //         if(JSON.parse(isJiraEnabled)){
    //             $scope.isConnectedToJira = isConnectedToJira;
    //         }
    //         getJiraClosedStatusName();
    //         initAttachedWorkItems();
    //         initNewIssue(true);
    //         initNewTask(true);
    //         getIssues();
    //         getTasks();
    //     })();
    // }

})();
