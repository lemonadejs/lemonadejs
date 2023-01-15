const path = require('path');

module.exports = {
    target: 'web',
    entry: './src/index.js',
    mode: 'development',
    optimization: {
        minimize: false
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'public/dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    devServer: {
        // contentBase
        static : {
            directory : path.join(__dirname, "/")
        },
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
        port: 3005,
        devMiddleware: {
            publicPath: "https://localhost:3005/dist/",
        },
        hot: "only",
    },
    stats: { warnings:false },
};