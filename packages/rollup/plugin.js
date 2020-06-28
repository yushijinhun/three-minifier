const createNodeResolver = require("@rollup/plugin-node-resolve").nodeResolve;
const parseOptions = require("@yushijinhun/three-minifier-common").parseOptions;
const MagicString = require("magic-string");

exports.threeMinifier = () => {
    const nodeResolver = createNodeResolver();
    const minifier = parseOptions();

    return {
        id: "threeMinifier",

        buildStart(options) {
            nodeResolver.buildStart(options);
        },

        generateBundle() {
            nodeResolver.generateBundle();
        },

        resolveId: async (moduleName, file) => {
            const origin = await nodeResolver.resolveId(moduleName, file);
            if (origin) {
                const transformedId = minifier.transformModule(origin.id);
                if (transformedId === null) {
                    if (minifier.clearSideEffects(origin.id)) {
                        origin.moduleSideEffects = false;
                        return origin;
                    }
                } else {
                    const transformed = await nodeResolver.resolveId(transformedId);
                    if (minifier.clearSideEffects(transformed.id)) {
                        transformed.moduleSideEffects = false;
                    }
                    return transformed;
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

