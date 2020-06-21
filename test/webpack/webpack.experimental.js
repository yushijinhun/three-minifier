const path = require('path');
const ThreeMinifierPlugin = require('@yushijinhun/three-minifier-webpack');
const threeMinifier = new ThreeMinifierPlugin();

module.exports = {
  entry: './index.js',
  plugins: [ threeMinifier ],
  output: {
    path: path.resolve(__dirname, 'dist_experimental'),
    filename: 'bundle.js',
  },
  resolve: {
    plugins: [ threeMinifier.resolver ],
  },
};
