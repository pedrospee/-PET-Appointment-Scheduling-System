const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    /**
    Single entry point for the app.
    main.js imports CSS and initializes the UI modules.
     */
    entry: path.resolve(__dirname, "src", "main.js"),

    /**
    Bundle output for development and production builds.
    clean: true ensures dist is always consistent across builds.
     */
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bundle.js",
      clean: true,
    },

    /**
    Source maps:
    - eval-source-map gives fast rebuilds in dev
    - source-map provides better production debugging
     */
    devtool: isProd ? "source-map" : "eval-source-map",

    module: {
      rules: [
        
        //Transpile modern JS to a broadly compatible baseline.
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [["@babel/preset-env", { targets: "defaults" }]],
            },
          },
        },

        /**
        CSS pipeline:
        - css-loader resolves imports and URLs
        - style-loader injects CSS into the page during runtime
         */
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ],
    },

    plugins: [
      /**
      Generates dist/index.html based on the root template.
      scriptLoading: "module" keeps ESM-friendly output.
       */
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, "index.html"),
        scriptLoading: "module",
      }),

      /**
      Copies static files into dist.
      - server.json is useful for preview/deploy scenarios
      - css/ is copied for projects that still serve external CSS (optional)
      */
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "server.json"),
            to: "server.json",
            noErrorOnMissing: true,
          },
          {
            from: path.resolve(__dirname, "css"),
            to: "css",
            noErrorOnMissing: true,
          },
        ],
      }),
    ],

    devServer: {
      /**
      Serve dist as the base directory.
      historyApiFallback keeps the dev server resilient to refreshes.
      */
      static: {
        directory: path.resolve(__dirname, "dist"),
      },
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
    },

    resolve: {
      extensions: [".js"],
    },
  };
};