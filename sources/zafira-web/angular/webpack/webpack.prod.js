const merge = require('webpack-merge');
const common = require('./webpack.common.js');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = merge(common, {
    devtool: false,
    // plugins: [
    //     new ExtractTextPlugin({
    //         filename: `[name]-${version}.css`
    //     })
    // ],
    mode: 'production',
    // mode: 'none',
    output: {
        filename: 'js/[name].build.min.js',
        chunkFilename: 'js/[name].chunk.min.js'
    },
    module: {
        rules: [
            // {
            //     test: /\.scss|sass$/,
            //     loader: 'style!css!sass',
            //     // exclude: [/app\/app\.styl$/],
            // },
            // {
            //     test: /\.(sa|sc|c)ss$/,
            //     use: [
            //         MiniCssExtractPlugin.loader,
            //         {loader: 'css', options: { importLoaders: 1 }},
            //         // {loader: `postcss`, options: {options: {}}},
            //         'sass',
            //     ],
            // }
            // {
            //     test: /\.styl$/,
            //     loader: ExtractTextPlugin.extract({
            //         fallback: 'style',
            //         use: ['css', 'stylus']
            //     }),
            //     include: [/app\/app\.styl$/]
            // },
        ]
    },
    optimization: {
        minimize: false,
        // minimizer: [
        //     new UglifyJsPlugin(),
        // ],
        splitChunks: {
            // name: false
        }
    },
    plugins: [
        new CleanWebpackPlugin(['../dist'], {
            allowExternal: true
        }),
    ]
});
