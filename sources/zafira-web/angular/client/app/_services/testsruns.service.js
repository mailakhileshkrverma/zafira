(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('testsRunsService', ['TestRunService', '$q', '$rootScope', 'UtilService', 'API_URL', testsRunsService]);

    function testsRunsService(TestRunService, $q, $rootScope, UtilService, API_URL) {
        let _lastResult = [];
        let _lastParams = null;
        let _lastFilters = null;

        return {
            fetchTestRuns: fetchTestRuns,
            addBrowserVersion: addBrowserVersion,
            addJob: addJob,
            getLastSearchParams: getLastSearchParams,
        };

        function fetchTestRuns(params, filters) {//TODO: return saved data (check conditions before) and implement force for fetching
            const defaultParams = {
                date: null,
                fromDate: null,
                toDate: null,
                page: 1,
                pageSize: 20,
                id: null,
                projects: null
            };

            params = angular.extend({}, defaultParams, params || {}); //TODO: do we need to remove NULL values?

            // save search params
            _lastParams = params;
            _lastFilters = filters;

            return TestRunService.searchTestRuns(params, filters).
                then(function(rs) {
                    if (rs.success) {
                        const testRuns = rs.data.results;

                        testRuns.forEach(function(testRun) {
                            addBrowserVersion(testRun);
                            addJob(testRun);
                            testRun.tests = null;
                        });

                        _lastResult = rs.data;

                        console.log(_lastResult);
                        return $q.resolve(_lastResult);
                    } else {
                        console.error(rs.message);
                        return $q.reject(rs);
                    }
                });

        }

        function getLastSearchParams() {
            return _lastParams;
        }

        function addBrowserVersion(testRun) {
            const platform = testRun.platform
                ? testRun.platform.split(' ')
                : [];
            let version = null;

            if (platform.length > 1) {
                version = 'v.' + platform[1];
            }

            if (!version && testRun.config && testRun.config.browserVersion !== '*') {
                version = testRun.config.browserVersion;
            }

            testRun.browserVersion = version;
        }

        function addJob(testRun) {
            if (testRun.job && testRun.job.jobURL) {
                testRun.jenkinsURL = testRun.job.jobURL + '/' + testRun.buildNumber;
                testRun.UID = testRun.testSuite.name + ' ' + testRun.jenkinsURL;
            }
        }
    }
})();
