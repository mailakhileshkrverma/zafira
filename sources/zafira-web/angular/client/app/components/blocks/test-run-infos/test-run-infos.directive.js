
(function() {
    'use strict';

    angular.module('app.testRunInfos').directive('testRunInfos', function() {
        return {
            templateUrl: 'app/components/blocks/test-run-infos/test-run-infos.html',
            controller: function TestRunInfosController(modalsService, $rootScope) {
                var vm = {
                    test: null,
                    id: null,
                    showDetailsDialog: showDetailsDialog,
                };  
                vm.$onInit = init;

                return vm;
                function init() {
                }
                function showDetailsDialog(test, event) {
                    const isNew = setWorkItemIsNewStatus(test.workItems);
        
                    modalsService.openModal({
                        controller: 'TestDetailsModalController',
                        templateUrl: 'app/components/modals/test-details/test-details.html',
                        parent: angular.element(document.body),
                        targetEvent: event,
                        locals: {
                            test: test,
                            isNewIssue: isNew.issue,
                            isNewTask: isNew.task,
                            isConnectedToJira: $rootScope.tools['JIRA'],
                            isJiraEnabled: $rootScope.jira.enabled
                        }
                    })
                    .catch(function(response) {
                        if (response) {
                            vm.testRun.tests[test.id] = angular.copy(response);
                        }
                    });
                }
                function setWorkItemIsNewStatus(workItems) {
                    const isNew = {
                        issue: true,
                        task: true
                    };
        
                    workItems.length && workItems.forEach(function(item) {
                        switch (item.type) {
                            case 'TASK':
                                isNew.task = false;
                                break;
                            case 'BUG':
                                isNew.issue = false;
                                break;
                        }
                    });
        
                    return isNew;
                }
            },
            
            scope: {
                test: '=',
                id: '=',
            },
            controllerAs: '$ctrl',
            restrict: 'E',
            replace: true,
            bindToController: true
        };
    });
})();
