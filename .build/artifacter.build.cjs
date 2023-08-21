/**
 * Artifact Manager
 * 
 * Generates an Artifact Manifest for each build and compares it against the current solution.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const { config } = require("./config.build.cjs");
const manifest_file =  config.artifacter.manifestFile;

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { getDirectoryHash } = require("./util/hash.cjs");
const { logger } = require("./util/log.cjs");

async function getManifestFile(filePath) {
	if (filePath) {
		if (fs.existsSync(filePath)) {
			const data = require(filePath);
			return data;
		}
	}
	
	return null;
}

/**
 * Checks if the solution should be (re)built.
 *
 * @param {import("./types.build.cjs").BuildOptions} options
 * @return {Promise<import("./types.build.cjs").BuildStats>} 
 */
async function shouldBuildBeUpdated(options) {
    const filePath = path.join(options.paths.distDir, manifest_file);

    logger.info(`[ARTIFACT] Attempting to read build manifest data from '${filePath}'`);
    const data = await getManifestFile(filePath);

	if (data && data.src_sha256 && data.dist_sha256) {
        logger.info(`[ARTIFACT] Manifest is valid. Comparing artifact hashes with current solution.`);
        
		const curSrcHash = await getDirectoryHash(options.paths.srcDir);
		const curDistHash = await getDirectoryHash(options.paths.distDir, [filePath]);

        if (curSrcHash !== data.src_sha256) logger.info(`[ARTIFACT] Source is more recent. Rebuild is required.`);
        else if (curDistHash !== data.dist_sha256) logger.info(`[ARTIFACT] Build is corrupted. Rebuild is required.`);
        else logger.success(`[ARTIFACT] Build is up-to-date.`);

		return {
			src: curSrcHash !== data.src_sha256,
			dist: curDistHash !== data.dist_sha256
		};
	}

    logger.warn(`[ARTIFACT] Manifest does not exist or is corrupted. Rebuild required.`);
	
	return {
		src: true,
		dist: true
	};
}

/**
 * Creates a new Build Manifest for a solution build.
 *
 * @param {import("./types.build.cjs").BuildOptions} options
 */
async function createManifestFile(options) {
    const filePath = path.join(options.paths.distDir, manifest_file);

    logger.info(`[ARTIFACT] Creating manifest for artifact at '${filePath}'.`);
    logger.info(`[ARTIFACT] Generating solution hashes...`);

	const curSrcHash = await getDirectoryHash(options.paths.srcDir);
	const curDistHash = await getDirectoryHash(options.paths.distDir, [filePath]);

	const data = {
		date: Date.now(),
		src_sha256: curSrcHash,
		dist_sha256: curDistHash
	}

    logger.info(`[ARTIFACT] Writing data to manifest file...`);

	await fsp.writeFile(filePath, JSON.stringify(data, null, 4), { encoding: "utf8" });

    logger.success(`[ARTIFACT] Artifact manifest successfully generated.`);
}

if (require.main === module) {
	// ;(async () => {
	// 	if (process.argv.includes("--debug")) global._buildOptions.debug = true;
	// 	require("./.build.cjs");

	// 	await init(global._buildOptions);

	// 	const shouldUpdate = await shouldBuildBeUpdated(global._buildOptions);
	// 	if (shouldUpdate.src || shouldUpdate.dist) process.exit(0);
	// 	else {
	// 		logger.success(`[ARTIFACT] Build is up-to-date. Skipping.`);
	// 		process.exit(1);
	// 	}
	// })();
} else {
	module.exports.shouldBuildBeUpdated = shouldBuildBeUpdated;
	module.exports.createManifestFile = createManifestFile;
}