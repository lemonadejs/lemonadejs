const path = require('path');
//const MiniCssExtractPlugin = require("mini-css-extract-plugin");
//const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
//const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
//const WebpackObfuscator = require('webpack-obfuscator');

let dependencies = {
    jsuites: "''"
}

const webpack = {
    target: [ 'web', 'es5' ],
    entry: './src/index.js',
    mode: 'development',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'jspreadsheet',
        libraryExport: 'default'
    },
    //externals: dependencies,
    plugins: [],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ],
            }
        ],
    },
    devServer: {
        // contentBase
        static : {
            directory : path.join(__dirname, "/public/")
        },
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
        port: 8000,
        devMiddleware: {
            publicPath: "https://localhost:3000/",
        },
        hot: "only",
        liveReload: true,
    },
    stats: {
        warnings: false
    },
    optimization: {
        minimize: false,
    }
};

module.exports = webpack;