import { execSync } from "node:child_process";
import path, { resolve } from "node:path";

import webpack from "webpack";

const gitRevision = execSync("git rev-parse HEAD").toString().replace(/\n/, "");
const gitStatus = execSync("git status --porcelain").toString();
const buildVersion = gitStatus === "" ? gitRevision : "dirty";
const buildTime = new Date().getTime();

const config: webpack.Configuration = {
  devtool: false,
  entry: "./src",
  externals: {
    react: "React",
    "react-dom": "ReactDOM",
    leaflet: "L",
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: false,
  },
  output: {
    path: resolve("public/dist"),
  },
  plugins: [
    new webpack.SourceMapDevToolPlugin({ filename: "[file].map" }),
    new webpack.DefinePlugin({
      BUILD_VERSION: JSON.stringify(buildVersion),
      BUILD_TIME: JSON.stringify(buildTime),
    }),
  ],
  resolve: {
    alias: {
      "@components/*": path.resolve(__dirname, "src/components/*"),
      "@hooks/*": path.resolve(__dirname, "src/hooks/*"),
      "@lib/*": path.resolve(__dirname, "src/lib/*"),
      "@pages/*": path.resolve(__dirname, "src/pages/*"),
    },
    extensions: [".js", ".ts", ".tsx"],
  },
};

export default config;
