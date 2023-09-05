const path = require('path');
const webpack = require('webpack');

const childProcess = require('child_process');
const gitRevision = childProcess.execSync('git rev-parse HEAD').toString().replace(/\n/, '');
const gitStatus = childProcess.execSync('git status --porcelain').toString();
const buildVersion = ((gitStatus === '') ? gitRevision : 'dirty');
const buildTime = new Date().getTime();
console.log({ buildVersion, buildTime });

module.exports = {
    devtool: false,
    entry: './src',

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM"
    },

    mode: "production",

    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.(css)$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                        },
                    },
                ],
            },
        ]
    },
    optimization: {
        minimize: false
    },
    output: {
        path: path.resolve(__dirname, 'public/dist'),
    },
    plugins: [
        new webpack.SourceMapDevToolPlugin({}),
        new webpack.DefinePlugin({
          'BUILD_VERSION': JSON.stringify(buildVersion),
          'BUILD_TIME': JSON.stringify(buildTime),
        }),
    ],
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        alias: {
            "@components": path.join(__dirname, "src", "js/components"),
            lib: path.join(__dirname, "src", "lib")
        },
    }
};
