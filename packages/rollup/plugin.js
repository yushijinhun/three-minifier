const minifier = require("@yushijinhun/three-minifier-common");
const MagicString = require("magic-string");

exports.threeMinifier = (minifierOptions = {}) => {
	const resolveAdditionalModules = minifierOptions.resolveAdditionalModules !== false;

	return {
		id: "threeMinifier",

		async resolveId(moduleName, file, options) {
			const origin = await this.resolve(moduleName, file, { skipSelf: true, ...options });
			if (origin) {
				const transformedId = minifier.transformModule(origin.id);
				if (transformedId === null) {
					if (minifier.clearSideEffects(origin.id)) {
						origin.moduleSideEffects = false;
						return origin;
					}
				} else {
					const transformed = await this.resolve(transformedId);
					if (minifier.clearSideEffects(transformed.id)) {
						transformed.moduleSideEffects = false;
					}
					return transformed;
				}
			} else {
				if (resolveAdditionalModules) {
					const resolved = minifier.transformAdditionalModules(moduleName);
					if (resolved !== null) {
						return await this.resolve(resolved, file, { skipSelf: true, ...options });
					}
				}
			}
		},

		transform(code, id) {
			if (id && minifier.isThreeSource(id)) {
				const s = new MagicString(code);
				for (const match of minifier.transformCode(code, id)) {
					s.overwrite(match.start, match.end, match.replacement);
				}
				return {
					code: s.toString(),
					map: s.generateMap()
				};
			}
		}
	};
};

