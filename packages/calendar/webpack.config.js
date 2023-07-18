const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = () => {
    const config = {
        target: ['web', 'es5'],
        entry: {
            index: './src/index.js'
        },
        mode: 'production',
        output: {
            library: {
                name: 'Calendar',
                type: 'umd',
                export: ['default']
            },
            globalObject: 'this',
            filename: '[name].js'
        },
        externals: {
            lemonadejs: {
                'commonjs': 'lemonadejs',
                'commonjs2': 'lemonadejs',
                'amd': 'lemonadejs',
                'root': 'lemonade'
            }
        },
        plugins: [],
        optimization: {
            minimize: false
        },
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [MiniCssExtractPlugin.loader, 'css-loader']
                }
            ]
        },
        stats: { warnings: false }
    };

    config.plugins.push(
        new MiniCssExtractPlugin({
            filename: 'style.css'
        })
    );

    return config;
};