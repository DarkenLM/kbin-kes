/**
 * Asset builder
 * 
 * Copies non-source files from the solution to their mirrored folders on the build.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const { config } = require("./config.build.cjs");
const ignoreExts = config.assets.ignoreExts;

const path = require("path");
const { readdir, mkdir, copyFile } = require('fs').promises;
const { existsSync } = require('fs');
const { logger } = require("./util/log.cjs");

async function getFiles(dir) {
	const dirents = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(dirents.map((dirent) => {
		const res = path.resolve(dir, dirent.name);
		return dirent.isDirectory() ? getFiles(res) : res;
	}));
	return Array.prototype.concat(...files);
}

async function assetBuilder(options) {
	let assets = 0
	let basePath = options.paths.srcDir;

	logger.info("[ASSETS] Reading solution source...");
	let originals = await getFiles(basePath)
	logger.success("[ASSETS] Successfully read solution source.");

	logger.info("[ASSETS] Reading solution files...");
	for (const orig of originals) {
		logger.info(`[ASSETS] Attempting to process asset '${orig}'...`);

		let _srcFile = orig.replace(basePath, '')
		let srcFile = _srcFile.startsWith(path.sep) ? _srcFile.replace(path.sep, '') : _srcFile
		let reflectedFile = path.resolve(path.join(options.paths.distDir, srcFile))
		let reflectedDirName = path.dirname(reflectedFile)

		logger.info("[ASSETS] Asserting asset validity...");
		if (ignoreExts.includes(path.extname(reflectedFile))) {
            logger.warn("[ASSETS] Not an asset. Skipping.")
			continue;
		} else if (config.assets.ignoreFiles.includes(path.basename(orig))) {
            logger.warn("[ASSETS] Asset is present on ignore list. Skipping.")
			continue;
        }
		logger.info("[ASSETS] Asset is valid. Proceeding.");

		if (!existsSync(reflectedDirName)) {
			logger.warn(`[ASSETS] Asset's parent directory does not exist, creating ${reflectedDirName}.`);
			await mkdir(reflectedDirName, {
				recursive: true
			})
		}

		logger.info(`[ASSETS] Copying asset to '${reflectedFile}'...`);
		await copyFile(orig, reflectedFile)
		assets++
		logger.success(`[ASSETS] Sucessfully copied asset.`);
	}

	return { assets }
}

async function init(options) {
	logger.log("[ASSETS]  --------------- ASSET BUILDER --------------");

	const { assets } = await assetBuilder(options);
	logger.success(`Finished building ${assets} assets.`);

	logger.log("[ASSETS]  ----------- ASSET BUILDER FINISHED ----------");
}

if (require.main === module) {

} else {
    module.exports.init = init
}