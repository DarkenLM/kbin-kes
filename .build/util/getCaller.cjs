/**
 * Gets the caller of the function. Can be offset to allow proxying.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 * 
 * @param {string} parentPath The full path of the parent to be removed from the beginning of the returned line.
 * @param {number} ignoreLevels The number of lines to be poped from the stack trace before processing.
 */
function getCallerFilePathAndPosition(parentPath, ignoreLevels) {
    const error = new Error();
    const stackLines = error.stack.split("\n").slice(ignoreLevels + 1);
  
    for (const line of stackLines) {
        const filePositionRegex = /at\s+(.*?)\s+\((.*?):(\d+):\d+\)/;
        const match = filePositionRegex.exec(line);

        if (match && match[1] !== "getCallerFilePathAndPosition") {
            const filePath = match[2];
            const relativeFilePath = filePath.replace(parentPath, "").replace(/^\//, "");
            const position = match[3];

            return `${relativeFilePath}:${position}`.replace(/^[\\\/]/, "");
        }
    }
  
    return "Unknown";
}

module.exports.getCallerFilePathAndPosition = getCallerFilePathAndPosition;