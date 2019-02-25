'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');


module.exports = {
    devtool: 'source-map',
    node: {
        fs: 'empty'
    },
    context: path.join(__dirname, '../client/app'),
    entry: {
        vendors: './app.vendors.js',
        app: './app.module.js'
    },
    output: {
        filename: 'js/[name].build.js',
        path: path.join(__dirname, '../dist'),
        chunkFilename: 'js/[name].chunk.js'
    },
    resolve: {
        modules: [
            path.join(__dirname, '../client/app'),
            path.join(__dirname, '../client/assets'),
            path.join(__dirname, '../node_modules')
        ],
        alias: {
            'jquery-ui': 'jquery-ui/ui',
            'humanizeDuration': 'humanize-duration'
        }
    },
    module: {
        rules: [
            {
                // "oneOf" will traverse all following loaders until one will
                // match the requirements. When no loader matches it will fall
                // back to the "file" loader at the end of the loader list.
                oneOf: [
                    {
                        test: /\.m?js$/,
                        exclude: [/node_modules/],
                        use: [
                            {
                                loader: 'babel',
                                options: {
                                    presets: ['@babel/preset-env'],
                                    plugins: [
                                        '@babel/plugin-proposal-object-rest-spread',
                                        '@babel/transform-runtime',
                                        ['angularjs-annotate', { 'explicitOnly' : true}],
                                        '@babel/plugin-syntax-dynamic-import'
                                    ]
                                }
                            },
                        ]

                    },
                    {
                        test: /\.(gif|png|jpe?g|svg)$/i,
                        loader: 'url',
                        exclude: [
                            path.resolve(__dirname, '../node_modules/font-awesome/fonts')
                        ],
                        options: {
                            limit: 8192,
                            name: 'media/[name].[hash:8].[ext]',
                        },
                    },
                    {
                        test: /\.(otf|ttf|eot|woff2?|svg)$/i,
                        include: [
                            path.resolve(__dirname, '../node_modules/font-awesome/fonts')
                        ],
                        loader: 'file',
                        options: {
                            name: 'media/fonts/[name].[ext]',
                        },
                    },
                    {
                        test: /\.html$/,
                        loader: 'html',
                        options: {
                            attrs: [':md-svg-src', ':data-src', ':src']
                        }
                    },
                    {
                        test: /\.(sa|sc|c)ss$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            {loader: 'css', options: { importLoaders: 1 }},
                            // {loader: `postcss`, options: {options: {}}}, //TODO: use this
                            'sass',
                        ],
                    },
                    // "file" loader makes sure those assets get served by WebpackDevServer.
                    // When you `import` an asset, you get its (virtual) filename.
                    // In production, they would get copied to the `build` folder.
                    // This loader doesn't use a "test" so it will catch all modules
                    // that fall through the other loaders.
                    {
                        loader: 'file',
                        // Exclude `js` files to keep "css" loader working as it injects
                        // its runtime that would otherwise be processed through "file" loader.
                        // Also exclude `html` and `json` extensions so they get processed
                        // by webpacks internal loaders.
                        exclude: [/\.(s?css)$/, /\.(m?js)$/, /\.html$/, /\.json$/],
                        options: {
                            name: 'media/1111/[name].[hash:8].[ext]',
                        },
                    },
                    // ** STOP ** Are you adding a new loader?
                    // Make sure to add the new loader(s) before the "file" loader.
                ]
            },






            // {
            //     test: /\.m?js$/,
            //     exclude: [/node_modules/],
            //     use: [
            //         {
            //             loader: 'babel',
            //             options: {
            //                 presets: ['@babel/preset-env'],
            //                 plugins: [
            //                     '@babel/plugin-proposal-object-rest-spread',
            //                     '@babel/transform-runtime',
            //                     ['angularjs-annotate', { 'explicitOnly' : true}],
            //                     '@babel/plugin-syntax-dynamic-import'
            //                 ]
            //             }
            //         },
            //     ]
            //
            // },
            // {
            //     test: /\.(gif|png|jpe?g|svg)$/i,
            //     loader: 'url',
            //     exclude: [
            //         path.resolve(__dirname, '../node_modules/font-awesome/fonts')
            //     ],
            //     options: {
            //         limit: 8192,
            //         name: 'media/[name].[hash:8].[ext]',
            //     },
            // },
            // {
            //     test: /\.(otf|ttf|eot|woff2?|svg)$/i,
            //     include: [
            //         path.resolve(__dirname, '../node_modules/font-awesome/fonts')
            //     ],
            //     loader: 'file',
            //     options: {
            //         name: 'media/fonts/[name].[ext]',
            //     },
            // },
            // {
            //     test: /\.html$/,
            //     loader: 'html',
            //     options: {
            //         attrs: [':md-svg-src', ':data-src', ':src']
            //     }
            // },
            // {
            //     test: /\.(sa|sc|c)ss$/,
            //     use: [
            //         MiniCssExtractPlugin.loader,
            //         {loader: 'css', options: { importLoaders: 1 }},
            //         // {loader: `postcss`, options: {options: {}}}, //TODO: use this
            //         'sass',
            //     ],
            // },
            // // "file" loader makes sure those assets get served by WebpackDevServer.
            // // When you `import` an asset, you get its (virtual) filename.
            // // In production, they would get copied to the `build` folder.
            // // This loader doesn't use a "test" so it will catch all modules
            // // that fall through the other loaders.
            // // {
            // //     loader: 'file',
            // //     // Exclude `js` files to keep "css" loader working as it injects
            // //     // its runtime that would otherwise be processed through "file" loader.
            // //     // Also exclude `html` and `json` extensions so they get processed
            // //     // by webpacks internal loaders.
            // //     exclude: [/\.(s?css)$/, /\.(m?js)$/, /\.html$/, /\.json$/],
            // //     options: {
            // //         name: 'media/1111/[name].[hash:8].[ext]',
            // //     },
            // // },
            // // ** STOP ** Are you adding a new loader?
            // // Make sure to add the new loader(s) before the "file" loader.
        ]
    },
    resolveLoader: {
        moduleExtensions: ['-loader']
    },
    plugins: [
        // new CopyWebpackPlugin(
        //     [{ from: '../assets', to: 'assets'}]
        // ),
        new MiniCssExtractPlugin({
            filename: 'css/[name].css',
            chunkFilename: 'css/[name].chunk.css'
        }),
        new HtmlWebpackPlugin({
            template: '../index.html',
            favicon: '../favicon.ico',
            showErrors: true
        }),
        new webpack.ProgressPlugin(),
        // new BundleAnalyzerPlugin(),
        // To strip all locales except “en”
        new MomentLocalesPlugin(),
    ],
    optimization: {
        runtimeChunk: 'single',
        namedModules: true,
        namedChunks: true,
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendors: false
            }
        }
    },
    stats: {
        colors: true,
    }
};
