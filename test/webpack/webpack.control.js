const path = require('path');
module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist_control'),
    filename: 'index.js',
  },
  devtool: 'source-map',
  mode: 'production',
  performance: {
    hints: false
  }
};
