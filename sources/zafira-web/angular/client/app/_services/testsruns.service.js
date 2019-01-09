(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('testsRunsService', ['TestRunService', '$q', '$rootScope', 'UtilService', 'API_URL', testsRunsService]);

    function testsRunsService(TestRunService, $q, $rootScope, UtilService, API_URL) {
        const searchTypes = ['testSuite', 'executionURL', 'appVersion'];
        let _lastResult = [];
        let _lastParams = null;
        let _lastFilters = null;
        let _activeFilterId = null;
        let _activeSearchType = searchTypes[0];
        let _searchParams = {};

        return  {
            fetchTestRuns: fetchTestRuns,
            addBrowserVersion: addBrowserVersion,
            addJob: addJob,
            getLastSearchParams: getLastSearchParams,
            getActiveFilter: getActiveFilter,
            setActiveFilter: setActiveFilter,
            resetActiveFilter:resetActiveFilter,
            isFilterActive: isFilterActive,
            setActiveSearchType: setActiveSearchType,
            getActiveSearchType: getActiveSearchType,
            resetActiveSearchType: resetActiveSearchType,
            getSearchValue: getSearchValue,
            getSearchValueByType: getSearchValueByType,
            setSearchValue: setSearchValue,
            setActiveSearchValue: setActiveSearchValue,
            resetSearchValue: resetSearchValue,
            isSearchActive: isSearchActive,
            setSearchParam: setSearchParam,
            getSearchParam: getSearchParam,
            deleteSearchParam: deleteSearchParam,
        };

        function fetchTestRuns(params, filter) {//TODO: return saved data (check conditions before) and implement force for fetching
            console.log(params);

            const defaultParams = {
                date: null,
                fromDate: null,
                toDate: null,
                page: 1,
                pageSize: 20,
                id: null,
                projects: null
            };

            params = angular.extend({}, defaultParams, _searchParams, params || {}); //TODO: do we need to remove NULL values?

            filter = _activeFilterId ? '?filterId=' + _activeFilterId : undefined;

            // save search params
            _lastParams = params;
            _lastFilters = filter;

            return TestRunService.searchTestRuns(params, filter).
                then(function(rs) {
                    if (rs.success) {
                        const testRuns = rs.data.results;

                        testRuns.forEach(function(testRun) {
                            addBrowserVersion(testRun);
                            addJob(testRun);
                            testRun.tests = null;
                        });

                        _lastResult = rs.data;

                        console.log('TestRunService.searchTestRuns', _lastResult);
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

        function setActiveFilter(id) {
            _activeFilterId = id;
        }

        function resetActiveFilter() {
            _activeFilterId = null;
        }

        function getActiveFilter() {
            return _activeFilterId;
        }

        function isFilterActive() {
            return !!_activeFilterId;
        }

        function setActiveSearchType(type) {
            _activeSearchType = type;
        }

        function getActiveSearchType() {
            return _activeSearchType;
        }

        function resetActiveSearchType() {
            _activeSearchType = searchTypes[0];
        }

        function setActiveSearchValue(value) {
            _searchParams[_activeSearchType] = value;
        }

        function setSearchValue(type, value) {
            _searchParams[type] = value;
        }

        function getSearchValue() {
            return _searchParams[_activeSearchType];
        }

        function getSearchValueByType(type) {
            return _searchParams[type];
        }

        function resetSearchValue() {
            searchTypes.forEach(function(type) {
                delete _searchParams[type];
            });
        }

        function isSearchActive() {
            return Object.keys(_searchParams).some(function(key) {
                return !!_searchParams[key];
            });
        }

        function setSearchParam(name, value) {
            _searchParams[name] = value;
        }

        function getSearchParam(name) {
            return _searchParams[name];
        }

        function deleteSearchParam(name) {
            delete _searchParams[name];
        }
    }
})();
