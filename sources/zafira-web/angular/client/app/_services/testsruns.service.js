(function () {
    'use strict';

    angular
        .module('app.services')
        .factory('testsRunsService', ['TestRunService', '$q', 'DEFAULT_SC', testsRunsService]);

    function testsRunsService(TestRunService, $q, DEFAULT_SC) {
        const searchTypes = ['testSuite', 'executionURL', 'appVersion'];
        let _lastResult = [];
        let _lastParams = null;
        let _lastFilters = null;
        let _activeFilterId = null;
        let _activeSearchType = searchTypes[0];
        let _searchParams = angular.copy(DEFAULT_SC);
        let _activeFilteringTool = null;

        return  {
            getSearchTypes: getSearchTypes,
            fetchTestRuns: fetchTestRuns,
            addBrowserVersion: addBrowserVersion,
            getLastSearchParams: getLastSearchParams,
            getActiveFilter: getActiveFilter,
            setActiveFilter: setActiveFilter,
            resetActiveFilter:resetActiveFilter,
            isFilterActive: isFilterActive,
            setActiveSearchType: setActiveSearchType,
            getActiveSearchType: getActiveSearchType,
            resetActiveSearchType: resetActiveSearchType,
            isSearchActive: isSearchActive,
            setSearchParam: setSearchParam,
            getSearchParam: getSearchParam,
            deleteSearchParam: deleteSearchParam,
            setActiveFilteringTool: setActiveFilteringTool,
            getActiveFilteringTool: getActiveFilteringTool,
            resetFilteringState: resetFilteringState,
            readStoredParams: readStoredParams,
            deleteStoredParams: deleteStoredParams,
        };

        function getSearchTypes() {
            return searchTypes;
        }

        function fetchTestRuns() {//TODO: return saved data (check conditions before) and implement force for fetching
            const filter = _activeFilterId ? '?filterId=' + _activeFilterId : undefined;

            // save search params
            deleteStoredParams();
            storeParams();
            _lastParams = angular.copy(_searchParams);
            _lastFilters = filter;

            return TestRunService.searchTestRuns(_searchParams, filter).
                then(function(rs) {
                    if (rs.success) {
                        const testRuns = rs.data.results;

                        testRuns.forEach(function(testRun) {
                            addBrowserVersion(testRun);
                            addJob(testRun);
                            testRun.tests = null;
                        });
                        _lastResult = rs.data;

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

        function setActiveSearchType(type) {
            _activeSearchType = type;
        }

        function getActiveSearchType() {
            return _activeSearchType;
        }

        function resetActiveSearchType() {
            _activeSearchType = searchTypes[0];
        }

        function resetSearchParams() {
            _searchParams = angular.copy(DEFAULT_SC);
            _lastParams = null;
            _lastFilters = null;
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

        function setActiveFilteringTool(tool) {
            _activeFilteringTool = tool;
        }

        function getActiveFilteringTool() {
            return _activeFilteringTool;
        }

        function deleteActiveFilteringTool() {
            _activeFilteringTool = null;
        }

        function isFilterActive() {
            return _activeFilteringTool === 'filter';
        }

        function isSearchActive() {
            return _activeFilteringTool === 'search';
        }

        function resetFilteringState() {
            deleteActiveFilteringTool();
            resetActiveSearchType();
            resetSearchParams();
            resetActiveFilter();
        }
        
        function storeParams() {
            sessionStorage.setItem('searchParams', angular.toJson(_searchParams));
            getActiveFilteringTool() && sessionStorage.setItem('activeFilteringTool', _activeFilteringTool);
            _activeFilterId && sessionStorage.setItem('activeFilterId', _activeFilterId);
        }

        function deleteStoredParams() {
            sessionStorage.removeItem('searchParams');
            sessionStorage.removeItem('activeFilteringTool');
            sessionStorage.removeItem('activeFilterId');
        }

        function readStoredParams() {
            const params = sessionStorage.getItem('searchParams');
            const filteringTool = sessionStorage.getItem('activeFilteringTool');

            params && (_searchParams = angular.fromJson(params));

            if (filteringTool) {
                setActiveFilteringTool(filteringTool);
                if (filteringTool === 'filter') {
                    const filterId = sessionStorage.getItem('activeFilterId');

                    filterId && setActiveFilter(+filterId);
                }
            }
        }
    }
})();
