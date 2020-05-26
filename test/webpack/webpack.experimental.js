const path = require('path');
const ThreeMinifierResolver = require('@yushijinhun/three-minifier-webpack');
const threeMinifier = new ThreeMinifierResolver();

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
