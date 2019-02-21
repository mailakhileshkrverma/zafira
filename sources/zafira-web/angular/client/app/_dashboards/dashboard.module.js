// import angular from 'angular';
import dashboardComponent from './dashboard.component';
import 'gridstack';
import '@epelc/gridstack-angular/dist/gridstack-angular';
import '../../vendors/pie-chart.min';
window.d3 = require('d3');
import 'n3-charts/build/LineChart.min';
window.echarts = require('echarts');
require('../../vendors/ngecharts'); //TODO: can't use npm  package because this file has custom changes
import ScreenshotService from './screenshot.util';

const dashboardModule = angular.module('app.dashboard', [
    'gridstack-angular',
    'n3-pie-chart',
    'n3-line-chart',
    'ngecharts',
    ])
    .factory('$screenshot', ScreenshotService)
    .component({ dashboardComponent });

export default dashboardModule;
