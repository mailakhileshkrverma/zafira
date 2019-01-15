(function() {
    'use strict';

    angular.module('app.testRunCard').directive('testRunCard', function() {
        return {
            templateUrl: 'app/components/blocks/test-run-card/test-run-card.html',
            controller: function TestRunCardController(mediaBreakpoints, windowWidthService,
                                                       testsRunsService, $rootScope, UtilService,
                                                       $state, $timeout, $mdDialog, $mdToast) {
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
                    tools: $rootScope.tools,

                    addToSelectedtestRuns: addToSelectedtestRuns,
                    showDetails: showDetails,
                    openMenu: openMenu,
                    openTestRun: openTestRun,
                    copyLink: copyLink,
                    markAsReviewed: markAsReviewed,
                    showCommentsDialog: showCommentsDialog,
                    sendAsEmail: sendAsEmail,
                    createSpreadsheet: createSpreadsheet,
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
                    $timeout(function() {
                        vm.currentOffset = $rootScope.currentOffset;
                        $msMenuCtrl.open($event);
                    });
                }

                function openTestRun() {
                    const url = $state.href('tests/run2', {testRunId: vm.testRun.id});

                    window.open(url,'_blank');
                }

                function copyLink() {
                    const url = $state.href('tests/run2', {testRunId: vm.testRun.id}, {absolute : true});

                    url.copyToClipboard();
                }

                function markAsReviewed() {
                    showCommentsDialog();
                }

                function sendAsEmail(event) {
                    showEmailDialog([vm.testRun], event);
                }

                function createSpreadsheet(event) {
                    showCreateSpreadsheetDialog([vm.testRun], event);
                };

                function showCommentsDialog(event) {
                    $mdDialog.show({
                        controller: 'CommentsController',
                        templateUrl: 'app/components/modals/comments/comments.html',
                        parent: angular.element(document.body),
                        targetEvent: event,
                        clickOutsideToClose:true,
                        fullscreen: true,
                        locals: {
                            testRun: vm.testRun,
                            isSlackAvailable: vm.isSlackAvailable,
                            slackChannels: vm.slackChannels
                        }
                    }).then(function(answer) {
                        vm.testRun.reviewed = answer.reviewed;
                        vm.testRun.comments = answer.comments;
                    });
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

                function showCreateSpreadsheetDialog(testRuns, event) {
                    $mdDialog.show({
                        controller: 'SpreadsheetController',
                        templateUrl: 'app/components/modals/spreadsheet/spreadsheet.html',
                        parent: angular.element(document.body),
                        targetEvent: event,
                        clickOutsideToClose:true,
                        fullscreen: true,
                        locals: {
                            testRuns: testRuns
                        }
                    })
                    .then(undefined, function(links) {
                        if (links.length) {
                            $mdToast.show({
                                hideDelay: 0,
                                position: 'bottom right',
                                locals: {
                                    links: links
                                },
                                controller: function ($scope, $mdToast, links) {
                                    $scope.links = links;

                                    $scope.closeToast = function () {
                                        $mdToast.hide();
                                    };
                                },
                                templateUrl: 'app/_testruns/links_toast.html'
                            });
                        }
                    });
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
