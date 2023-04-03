const path = require('path');

module.exports = {
  entry: './src/extension.ts',
  target: "webworker", // extensions run in a webworker context
  externals: {
    vscode: 'commonjs vscode'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'extension.js',
    path: path.resolve(__dirname, 'out/web'),
    libraryTarget: "commonjs",
    devtoolModuleFilenameTemplate: "../../[resource-path]"
  }
};
