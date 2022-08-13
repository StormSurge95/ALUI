const CopyPlugin = require("copy-webpack-plugin")
const HTMLInlineCSSWebpackPlugin = require("html-inline-css-webpack-plugin").default
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const WebpackCdnPlugin = require("webpack-cdn-plugin")
const path = require("path")

module.exports = {
    mode: "development",
    entry: "./source/client/index.ts",
    output: {
        filename: "gui.js",
        path: path.resolve(__dirname, "./build/client")
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        new HtmlWebpackPlugin({
            title: "AdventureLand Bot Interface"
        }),
        new WebpackCdnPlugin({
            modules: [],
            publicPath: "./"
        }),
        new HTMLInlineCSSWebpackPlugin({
            publicPath: "./"
        }),
        new CopyPlugin({
            patterns: [
                { from: "./source/client/assets", to: "./assets" },
                { from: "./source/client/images", to: "./images" }
            ]
        })
    ],
    target: "web",
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: "./"
                        },
                    },
                    "css-loader"
                ],
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    devServer: {
        open: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        }
    }
}