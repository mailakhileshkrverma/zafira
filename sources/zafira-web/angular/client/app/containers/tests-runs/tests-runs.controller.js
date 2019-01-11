(function () {
    'use strict';

    angular
    .module('app.testsRuns')
    .controller('TestsRunsController', [
        '$cookieStore',
        '$mdDialog',
        '$timeout',
        '$q',
        'TestRunService',
        'UtilService',
        'UserService',
        'SettingsService',
        'ConfigService',
        'resolvedTestRuns',
        'testsRunsService',
        TestsRunsController]);

    function TestsRunsController($cookieStore, $mdDialog, $timeout, $q, TestRunService, UtilService,
                                 UserService, SettingsService, ConfigService, resolvedTestRuns,
                                 testsRunsService) {
        const vm = {
            testRuns: resolvedTestRuns.results || [],
            totalResults: resolvedTestRuns.totalResults || 0,
            pageSize: resolvedTestRuns.pageSize,
            currentPage: resolvedTestRuns.page,
            selectedTestRuns: {},

            isTestRunsEmpty: isTestRunsEmpty,
            getTestRuns: getTestRuns,
            getLengthOfSelectedTestRuns: getLengthOfSelectedTestRuns,
            areTestRunsFromOneSuite: areTestRunsFromOneSuite,
            showCompareDialog: showCompareDialog,
            batchRerun: batchRerun,
            batchDelete: batchDelete,
            abortSelectedTestRuns: abortSelectedTestRuns,
            batchEmail: batchEmail,
            addToSelectedTestRuns: addToSelectedTestRuns,
        };

        vm.$onInit = init;

        return vm;

        function init() {
            loadSlackMappings();
            storeSlackAvailability();
            readStoredParams();
        }

        function readStoredParams() {
            const currentPage = testsRunsService.getSearchParam('page');
            const pageSize = testsRunsService.getSearchParam('pageSize');

            currentPage && (vm.currentPage = currentPage);
            pageSize && (vm.pageSize = pageSize);
        }

        function isTestRunsEmpty() {
            return vm.testRuns && !vm.testRuns.length;
        }

        function getTestRuns(page, pageSize) {
            console.log('doing fetching...', page); //TODO: remove before merge on prod

            const projects = $cookieStore.get('projects');

            projects && projects.length && testsRunsService.setSearchParam('projects', projects);
            if (page) {
                testsRunsService.setSearchParam('page', page);
                page !== vm.currentPage && (vm.currentPage = page);
            }
            pageSize && testsRunsService.setSearchParam('pageSize', pageSize);
            vm.selectAll = false;

            return testsRunsService.fetchTestRuns()
                .then(function(rs) {
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
                        const currentUser = UserService.getCurrentUser();

                        abortCause.comment = 'Aborted by ' + currentUser.username;
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
