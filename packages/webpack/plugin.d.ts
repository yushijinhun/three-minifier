import { WebpackPluginInstance } from "webpack/declarations/WebpackOptions";
import { Compiler } from "webpack"
import { ThreeMinifierOptions } from "@yushijinhun/three-minifier-common/options";

declare class ThreeMinifierPlugin implements WebpackPluginInstance {
	constructor(options?: ThreeMinifierOptions);

	apply: (compiler: Compiler) => void;

	readonly resolver: WebpackPluginInstance;
}

export = ThreeMinifierPlugin;
