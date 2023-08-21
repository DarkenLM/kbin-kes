/**
 * Root TSConfig reader.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const fsp = require("fs/promises");
const json5 = require("../vendor/json5/index.min.cjs");

async function readTSConfig(path) {
    const fileData = await fsp.readFile(path, { encoding: "utf8" });
    const tsconfig = json5.parse(fileData);
    return tsconfig;
}

module.exports = readTSConfig;