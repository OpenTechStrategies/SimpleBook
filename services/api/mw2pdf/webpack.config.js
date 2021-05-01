const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = [{
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'built'),
  },
  resolve: {
    extensions: ['.js', '.ts'],
  },
  target: 'node',
  entry: { main: path.resolve(__dirname, 'src/index.ts') },
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'ts-loader',
      options: {
        configFile: 'tsconfig.json',
      },
      exclude: [/node_modules/],
    }] 
  },
  externals: [nodeExternals()],
  mode: 'none',
}];
