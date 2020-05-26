const path = require('path');
module.exports = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist_control'),
    filename: 'bundle.js',
  }
};
