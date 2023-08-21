/**
 * KES generator utilities.
 * 
 * Partially adapted from https://github.com/aclist/kbin-kes/blob/main/gen.sh
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const childp = require("child_process");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

function getOwner() {
    try {
        const raw = executeCmd("git config --get remote.origin.url", false);
        const owner = raw.trim().split(/[:,/]/)[1];
        return owner;
    } catch (e) {
        return null;
    }
}

function executeCmd(cmd, crashOnFail) {
    try {
        const res = childp.execSync(cmd, { encoding: "utf8", stdio: "ignore" });
        return res;
    } catch (e) {
        if (crashOnFail) {
            console.error(`Error executing '${cmd}':`, e);
            process.exit(1);
        }
    }
}

function readFile(filePath) {
    return fs.readFileSync(filePath, { encoding: "utf8" });
}

function getRootedPath(options, ...filePaths) {
    return path.join(options.paths.root, ...filePaths);
}


module.exports.getOwner = getOwner;
module.exports.executeCmd = executeCmd;
module.exports.readFile = readFile;
module.exports.getRootedPath = getRootedPath;