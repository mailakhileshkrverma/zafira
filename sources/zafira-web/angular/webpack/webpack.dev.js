'use strict';

const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.join(__dirname, '../dist'),
        compress: true,
        port: 3000,
        disableHostCheck: true
    },
    mode: 'development',
    watch: true,
    stats: {
        // modules: true,
        // reasons: true,
        errorDetails: true
    }
});
