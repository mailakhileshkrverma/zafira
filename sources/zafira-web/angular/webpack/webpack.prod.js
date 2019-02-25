'use strict';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = merge(common, {
    devtool: false,
    mode: 'production',
    // mode: 'none',
    output: {
        filename: 'js/[name].build.min.js',
        chunkFilename: 'js/[name].chunk.min.js'
    },
    optimization: {
        minimizer: [
            // new UglifyJsPlugin({
            //     // uglifyOptions: {
            //     //     compress: {
            //     //         passes: 5 //Gives additional 3-5% of compression
            //     //     }
            //     // }
            // }),
            new OptimizeCssAssetsPlugin(),
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['../dist'], {
            allowExternal: true
        }),
    ]
});
