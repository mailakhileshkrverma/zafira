(function() {
    'use strict';

    angular.module('app.testRunCard').directive('testRunCard', function() {
        return {
            templateUrl: 'app/components/blocks/test-run-card/test-run-card.html',
            controller: function TestRunCardController(mediaBreakpoints, windowWidthService,
                                                       testsRunsService, $rootScope, UtilService) {
                var vm = {
                    testRun: null,
                    singleMode: false,
                    singleWholeInfo: false,
                    showNotifyInSlackOption: false,
                    showBuildNowOption: false,
                    showDeleteTestRunOption: false,
                    mobileBreakpoint: mediaBreakpoints.mobile || 0,
                    windowWidthService: windowWidthService,
                    isSlackAvailable: false,
                    slackChannels: null,
                    currentOffset: $rootScope.currentOffset,

                    addToSelectedtestRuns: addToSelectedtestRuns,
                    showDetails: showDetails,
                    openMenu: openMenu,
                };

                vm.$onInit = init;

                return vm;

                function init() {
                    initSlackChannels();
                    initSlackAvailability();
                }

                function initSlackChannels() {
                    vm.slackChannels = testsRunsService.getSlackChannels();

                    if (!vm.slackChannels) {
                        testsRunsService.fetchSlackChannels().then(function(slackChannels) {
                            vm.slackChannels = slackChannels;
                        });
                    }
                }

                function initSlackAvailability() {
                    if (testsRunsService.isSlackAvailabilityFetched()) {
                        vm.isSlackAvailable = testsRunsService.getSlackAvailability();
                    } else {
                        testsRunsService.fetchSlackAvailability().then(function(isSlackAvailable) {
                            vm.isSlackAvailable = isSlackAvailable;
                        });
                    }
                }

                function addToSelectedtestRuns() {
                    console.dir(vm.onSelect);
                    vm.onSelect && vm.onSelect(vm.testRun);
                }

                function showDetails() {
                    vm.singleWholeInfo = !vm.singleWholeInfo;
                }

                function initMenuRights() {
                    vm.showNotifyInSlackOption = (vm.isSlackAvailable && vm.slackChannels.indexOf(vm.testRun.job.name) !== -1) && vm.testRun.reviewed;
                    vm.showBuildNowOption = $rootScope.jenkins.enabled;
                    vm.showDeleteTestRunOption = true;
                }

                function openMenu($event, $msMenuCtrl) {
                    initMenuRights();
                    UtilService.setOffset($event);
                    vm.currentOffset = $rootScope.currentOffset;
                    $msMenuCtrl.open($event);
                }
            },
            scope: {
                singleMode: '=',
                testRun: '=',
                onSelect: '&'
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });
})();
