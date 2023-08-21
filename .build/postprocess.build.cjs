/**
 * Postprocessor
 * 
 * Corrects post-compiled code.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const { resolve, join, dirname, basename } = require('path');
const { readdir, stat } = require('fs').promises;
const { existsSync } = require('fs');
const { readFile, writeFile } = require('fs/promises');
const readTSConfig = require('./util/readTSConfig.cjs');
const minimatch = require("minimatch");
const { log, warn, consoleColors, logger } = require("./util/log.cjs");

async function getFiles(dir) {
	const dirents = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(dirents.map((dirent) => {
		const res = resolve(dir, dirent.name);
		return dirent.isDirectory() ? getFiles(res) : res;
	}));
	return Array.prototype.concat(...files);
}

async function importFixer(options, tsconfig) {
	try {
		const acceptedExts = [".ts", ".js", ".mjs"]
		const ignoreExts = [".d.ts"]
		let basePath = options.paths.distDir;

        const ephemeralPaths = tsconfig[".build"]?.ephemeralPaths || []

		logger.info("[POSTPROCESSOR] Reading solution build...");
		let originals = await getFiles(basePath)
		logger.success("[POSTPROCESSOR] Successfully read solution build.");

		logger.info("[POSTPROCESSOR] Reading solution files...");

		for (const orig of originals) {
			logger.info(`[POSTPROCESSOR] Attempting to process file '${orig}'...`);

			logger.info("[POSTPROCESSOR] Asserting file validity...");
			if (ignoreExts.some(e => basename(orig).endsWith(e))) {
				logger.warn("[POSTPROCESSOR] File is an exception. Skipping.")
				continue;
			} else if (!acceptedExts.some(e => basename(orig).endsWith(e))) {
				logger.warn("[POSTPROCESSOR] Not a source file. Skipping.")
				continue;
			} 
			logger.info("[POSTPROCESSOR] File is valid. Proceeding.");

			logger.info("[POSTPROCESSOR] Reading source file...");
			const fileData = await readFile(orig, { encoding: "utf8" })
			logger.success("[POSTPROCESSOR] Successfully read file.");

			logger.info("[POSTPROCESSOR] Verifying imports.");
			if (/(\bfrom\s+["']\..*(?<!.js))(["'])/gm.test(fileData)) {
				logger.warn("[POSTPROCESSOR] File has malformed imports. Fixing imports.");

				const reg = /(\bfrom\s+["'](?<path>\..*(?<!.js)))(["'])/gm;
				let arr, replaced = false, newFileData = fileData;

				while ((arr = reg.exec(fileData)) !== null) {
					replaced = false;
					if (!arr.groups.path) continue;
					
					const capDirPath = join(dirname(orig), arr.groups.path);

					const cdp_stats = existsSync(capDirPath) ? await stat(capDirPath) : null;
					if (!(cdp_stats && cdp_stats.isDirectory())) continue;
					
					const capPath = join(capDirPath, "/index");
					for (const ext of acceptedExts) {
						if (existsSync(capPath + ext)) {
							newFileData = newFileData.replace(arr[0], `${arr[1]}/index.js${arr[3]}`)
							replaced = true;
							break;
						}
					}
				}

				if (!replaced) newFileData = newFileData.replace(/(\bfrom\s+["']\..*(?<!.js))(["'])/gm, "$1.js$2")

				logger.info("[POSTPROCESSOR] Writing corrected data...");
				await writeFile(orig, newFileData, { encoding: "utf8" })
				logger.success("[POSTPROCESSOR] Successfully corrected file imports.");

				continue;
			} else {
				logger.info(`[POSTPROCESSOR] File has correct imports.`);
			}

            logger.info(`[POSTPROCESSOR] Checking for ephemeral imports...`)

            const reg = /^\s*import\s+.*\s+from\s+["'`](?<path>[^"']+)[^"']*["'`];?\s*$/gm;
            let arr, replaced = false, newFileData = fileData;

            while ((arr = reg.exec(newFileData)) !== null) {
                if (!arr.groups.path) continue;

                if (ephemeralPaths.some(p => minimatch.minimatch(arr.groups.path, p))) {
                    newFileData = newFileData.slice(0, arr.index) + newFileData.slice(arr.index + arr[0].length)
                    replaced = true;
                    reg.lastIndex = 0;
                }
            }

            logger.info("[POSTPROCESSOR] Writing corrected data...");
			await writeFile(orig, newFileData, { encoding: "utf8" })
			logger.success("[POSTPROCESSOR] Successfully corrected file ephemeral imports.");
		}
	} catch (e) {
		logger.error(`[POSTPROCESSOR] Could not validate exports: ${e}\n${e.stack}`);
		process.exit(1)
	}
}

async function init(options) {
	logger.log(" --------------- POSTPROCESSING ---------------");

    const tsconfig = await readTSConfig(join(options.paths.root, "tsconfig.json"));
	await importFixer(options, tsconfig)

	logger.log(" ----------- POSTPROCESSING FINISHED ----------");
}

if (require.main === module) {

} else {
    module.exports.init = init
}