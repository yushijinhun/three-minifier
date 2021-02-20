const minifier = require("@yushijinhun/three-minifier-common");
const Dependency = require("webpack/lib/Dependency");
const DependencyTemplate = require("webpack/lib/DependencyTemplate");

const pluginName = "ThreeMinifierPlugin";

class ThreeReplaceDependency extends Dependency {
	constructor(file) {
		super();
		this.file = file;
	}
}

ThreeReplaceDependency.Template = class ThreeReplaceTemplate extends DependencyTemplate {
	apply(dep, source) {
		const originalSource = source.original().source();
		for (const match of minifier.transformCode(originalSource, dep.file)) {
			source.replace(match.start, match.end - 1, match.replacement);
		}
	}
};

class ThreeMinifierPlugin {
	constructor() {
		this.resolver = {};
		this.resolver.apply = resolver => {
			resolver.getHook("resolve").tapAsync(pluginName, (request, resolveContext, callback) => {
				resolver.doResolve(resolver.ensureHook("internal-resolve"), request, null, resolveContext,
					(error, result) => {
						if (result && result.path) {
							const transformed = minifier.transformModule(result.path);
							if (transformed !== null) {
								resolver.doResolve(resolver.ensureHook("internal-resolve"),
									{
										...request,
										request: transformed
									},
									null, resolveContext, this._clearSideEffects(callback));
								return;
							}
						}
						this._clearSideEffects(callback)(error, result);
					}
				);

			});
		}
	}

	_clearSideEffects(callback) {
		return (error, result) => {
			if (result && result.path) {
				if (minifier.clearSideEffects(result.path)) {
					result.descriptionFileData.sideEffects = false;
				}
			}
			callback(error, result);
		};
	}

	apply(compiler) {
		compiler.hooks.compilation.tap(pluginName, compilation => {
			compilation.dependencyTemplates.set(
				ThreeReplaceDependency,
				new ThreeReplaceDependency.Template()
			);
			compilation.hooks.buildModule.tap(pluginName, module => {
				if (module.resource && minifier.isThreeSource(module.resource)) {
					module.addDependency(new ThreeReplaceDependency(module.resource));
				}
			});
		});
	}
};

module.exports = ThreeMinifierPlugin;
