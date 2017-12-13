const webpack = require('webpack');
const path = require("path");

// const prod = (process.env.NODE_ENV === 'production');

/**
 * Generates the bundle. Instructions available in README.md
 */
module.exports = function({ stats } = {}) {
  const config = {
    entry: {
      'codemotion': './src/codemotion.js'
    },
    output: {
      path: path.resolve('./build/'),
      filename: '[name].js',
    },
    resolve: {
      mainFields: ['jsnext:main', 'browser', 'main'],
    },
    module: {
      rules: [
        {
          // babel
          // overwrites .babelrc to remove CommonJS support
          test: /\.js$/,
          //exclude: /node_modules\/(?!alt-ng|preact)/,
          use: [{
            loader: 'babel-loader'
          }]
        }
      ]
    },
    plugins: [

      new webpack.SourceMapDevToolPlugin({
        filename: '[name].js.map',
        columns: false
      }),
      new webpack.NoEmitOnErrorsPlugin()

    ]
  }

/*
  if (prod) {
    // minimize JS
    new webpack.optimize.UglifyJsPlugin()
  }
*/
  return config;

}
