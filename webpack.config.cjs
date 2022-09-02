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
            modules: [
                {
                    name: "pixi.js",
                    prodUrl: "https://cdnjs.cloudflare.com/ajax/libs/:name/:version/browser/pixi.min.js",
                    var: "PIXI"
                },
                {
                    name: "@pixi/layers",
                    prodUrl: "https://unpkg.com/:name@:version/dist/pixi-layers.umd.js",
                    var: "PIXI.display"
                },
                {
                    name: "pixi-viewport",
                    prodUrl: "https://www.unpkg.com/:name@:version/dist/viewport.min.js",
                    var: "pixi_viewport"
                },
                {
                    name: "pixi-webfont-loader",
                    prodUrl: "https://www.unpkg.com/:name@:version/dist/pixi-webfont-loader.umd.min.js",
                    var: "PIXI"
                }
            ],
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
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        }
    }
}