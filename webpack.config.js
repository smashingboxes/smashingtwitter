var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: [
        './src/Main.js'
    ],
    output: {path: __dirname, filename: 'bundle.js'},
    cache: true,
    debug: true,
    devtool: 'source-map',
    resolve: {
        alias: {
            // 'Detector': 'three/examples/js/Detector',
            // 'GPUComputationRenderer': 'three/examples/js/GPUComputationRenderer',
            // 'stats': 'three/examples/js/libs/stats.min',
            // 'gui': 'three/examples/js/libs/dat.gui.min'
        }
    },
    module: {
        loaders: [
            {
                test: /\.glsl$/,
                loader: 'webpack-glsl',
                include: [
                    path.resolve(__dirname, 'src', 'shaders')
                ]
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: [
                    path.resolve(__dirname, 'src')
                ],
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            'THREE': 'three',
            'TweenMax': 'gsap',
            // 'Detector': 'three/examples/js/Detector',
            // 'GPUComputationRenderer': 'three/examples/js/GPUComputationRenderer',
            // 'stats': 'three/examples/js/libs/stats.min',
            // 'gui': 'three/examples/js/libs/dat.gui.min'
        })
    ]
};
