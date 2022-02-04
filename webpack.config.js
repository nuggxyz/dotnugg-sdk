//@ts-check

'use strict';

const path = require('path');

const webpack = require('webpack');

/**@type {import('webpack').Configuration}*/
const config = {
    target: 'async-node',

    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        libraryTarget: 'commonjs2',
        devtoolModuleFilenameTemplate: '../[resource-path]',
        publicPath: 'dist/',
        // wasmLoading: 'fetch',
    },
    devtool: 'source-map',
    externals: {
        fs: 'commonjs fs',
        path: 'commonjs path',
        util: 'commonjs util',
    },

    resolve: {
        mainFields: ['module', 'main', 'browser'], // look for `browser` entry point in imported node modules
        extensions: ['.ts', '.js'],
        alias: {
            // provides alternate implementation for node module and source files
        },
        fallback: {
            // fs: false,
            // path: require.resolve('path-browserify'),
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
            },
            {
                test: /\.wasm$/,
                type: 'javascript/auto',
                loader: 'arraybuffer-loader',
            },
        ],
    },
    node: {
        __dirname: true,
    },
};
module.exports = config;
