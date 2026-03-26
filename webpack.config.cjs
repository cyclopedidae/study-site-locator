const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',

    entry: {
        background: './src/background.js',
        content: './src/content.js',
        popup: './src/popup.js',
        offscreen: './src/offscreen.js'
    },

    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },

    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'public', to: '.' },
                { from: 'src/modules', to: './modules'}
            ],
        }),
    ],

    devtool: 'source-map',
};