/**
 * Mod copy script
 * 
 * This script automatically extracts, separates and processes mods from the original kbin-kes codebase,
 * and separates it to be used within this new one.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const acorn = require("../.build/vendor/acorn/index.cjs");

const kespath = path.join(__dirname, "../Master/kbin-kes-main");
const manifestpath = path.join(kespath, "helpers/manifest.json");
const modspath = path.join(kespath, "mods");

const srcPath = path.join(__dirname, "src");

async function init() {
    console.log("Kespath:", kespath);
    console.log("Mods path:", modspath);

    const manifest = require(manifestpath);
    console.log("MANIFEST:", manifest);

    const files = await fsp.readdir(modspath);
    console.log("files:", files);

    for (const file of files) {
        const origFilePath = path.join(modspath, file);
        const fileContent = fs.readFileSync(origFilePath, "utf-8");

        const parsedAst = acorn.parse(fileContent, { sourceType: "script" });

        const topLevelFunctions = [];
        for (const node of parsedAst.body) {
            if (node.type === "FunctionDeclaration") {
                topLevelFunctions.push(node.id.name);
            }
        }

        const manifIndex = manifest.findIndex(m => topLevelFunctions.includes(m.entrypoint));
        if (manifIndex === -1) continue;

        const manif = manifest[manifIndex];
        const filename = file.split(".")[0];
        const modulePath = path.join(srcPath, filename);

        await fsp.mkdir(path.join(srcPath, filename));
        await fsp.copyFile(origFilePath, path.join(modulePath, file));
        await fsp.writeFile(path.join(modulePath, "manifest.json"), JSON.stringify(manif, null, 4), { encoding: "utf8" });
    }
}

init();