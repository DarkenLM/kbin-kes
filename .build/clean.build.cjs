/**
 * Cleaner
 * 
 * Cleans provided paths within the build directory.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const { existsSync } = require("fs");
const { rm } = require("fs/promises");
const path = require("path");
const { log, consoleColors, logger } = require("./util/log.cjs");

async function cleaner(options, paths) {
	logger.info("[CLEANER] Cleaning up solution...");

	for (const _path of paths) {
        const resolvedPath = path.isAbsolute(_path) ? _path : path.join(options.paths.root, _path);

		logger.info(`[CLEANER] Cleaning '${resolvedPath}'...`);

		if (!existsSync(resolvedPath)) {
			logger.warn(`[CLEANER] ENOENT '${resolvedPath}'. Skipping.`);
			continue;
		}

		await rm(resolvedPath, { recursive: true, force: true });

		logger.success(`[CLEANER] Successfully cleaned '${resolvedPath}'.`);
	}

	logger.success("[CLEANER] Successfully cleaned solution.");
}

async function init(options, paths) {
	logger.log(" --------------- CLEANER ---------------");

	await cleaner(options, paths)

	logger.log(" ----------- CLEANER FINISHED ----------");
}

function makeCLI() {
    const cli = cac();
    cli.version('1.0.0');
    cli.help();
    cli.option("--debug, -d", "Enables debug mode.");
    cli.option("--clean-node-modules", "Cleans the node_modules directory.");

    const args = cli.parse();
    return args;
}

if (require.main === module) {
	// if (process.argv.includes("--debug")) global._buildOptions.debug = true;

    // const paths = [
    //     path.basename(options.paths.distDir)
    // ];

	// const cleanNodeModules = process.argv.includes("--clean-node-modules");
    // if (cleanNodeModules) paths.push("node_modules")

    const paths = [
        path.basename(options.paths.distDir)
    ];

    const args = makeCLI();

    if (args.options.help) return process.exit(0);

    if (args.options.debug) global._buildOptions.debug = true;
    if (args.options.cleanNodeModules) paths.push("node_modules");
    
    const { options } = require("./config.build.cjs");
	init(options, extraPaths);
} else {
    module.exports.init = init
}