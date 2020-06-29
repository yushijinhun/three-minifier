const path = require('path');
const ThreeMinifierPlugin = require('@yushijinhun/three-minifier-webpack');
const threeMinifier = new ThreeMinifierPlugin();

module.exports = {
	entry: './index.js',
	plugins: [ threeMinifier ],
	output: {
		path: path.resolve(__dirname, 'dist_experimental'),
		filename: 'index.js',
	},
	resolve: {
		plugins: [ threeMinifier.resolver ],
	},
	devtool: 'source-map',
	mode: 'production',
	performance: {
		hints: false
	}
};
