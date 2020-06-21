#!/usr/bin/env node

const threeRevision = require("./package.json").threeRevision;
const http = require("axios").default;
const astParser = require("acorn").Parser;
const astWalk = require("acorn-walk");
const fs = require("fs");
const path = require("path");
const url = `https://raw.githubusercontent.com/mrdoob/three.js/${threeRevision}/utils/build/rollup.config.js`;

async function main() {
    const source = (await http.get(url, { responseType: "text" })).data;
    const ast = astParser.parse(source, { sourceType: "module" });
    let constants = null;
    astWalk.simple(ast, {
        VariableDeclarator(node) {
            if (node.id.name === "constants") {
                constants = {};
                for (propNode of node.init.properties) {
                    constants[propNode.key.name] = propNode.value.value;
                }
            }
        }
    });
    if (constants === null || constants === {}) {
        throw "No constants found";
    }
    console.log("GL constants have been written to glconstants.json");
    fs.writeFileSync(path.resolve(__dirname, "glconstants.json"), JSON.stringify(constants));
}

main();
