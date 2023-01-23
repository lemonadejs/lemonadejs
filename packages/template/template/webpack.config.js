const path = require('path');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlReplaceWebpackPlugin = require("html-replace-webpack-plugin");

module.exports = (env, argv) => {
    const config = {
        target: 'web',
        entry: './src/index.js',
        optimization: {
            minimize: false
        },
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        argv.mode === "production"
                            ? MiniCssExtractPlugin.loader
                            : "style-loader",
                        "css-loader",
                    ],
                },
            ],
        },
        devServer: {
            // contentBase
            static : {
                directory : path.join(__dirname, "/public")
            },
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
            },
            port: 3005,
            devMiddleware: {
                publicPath: "https://localhost:3005/",
            },
            hot: "only",
        },
        plugins: [],
        stats: { warnings:false },
    };

    if (argv.mode === "production") {
        config.plugins.push(
            new MiniCssExtractPlugin({
                filename: "[contenthash].css",
            }),
            new CopyPlugin({
                patterns: [
                    {
                        context: "public",
                        from: "**/*",
                        globOptions: {
                            ignore: ["**/*.html"],
                        },
                        noErrorOnMissing: true,
                    },
                ],
            }),
            new HtmlWebpackPlugin({
                template: "public/index.html",
                minify: true,
                inject: "body",
            }),
            new HtmlReplaceWebpackPlugin([
                {
                    pattern: '<script src="index.js"></script>',
                    replacement: "",
                },
            ])
        );
    }

    return config;
};