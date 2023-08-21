/**
 * Build
 * 
 * Entry point for a full solution build.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const { config, options } = require("./config.build.cjs");
const { consoleColors, logger } = require("./util/log.cjs");
const { performance } = require("perf_hooks");
const { formatTime } = require("./util/formatTime.cjs");

const { distDir, sourceExts } = config;

const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const { cac } = require("cac");

let 
    /** @type {import("./clean.build.cjs")} */ cleaner, 
    /** @type {import("./build_module.build.cjs")} */ moduleBuilder, 
    /** @type {import("./genKES.build.cjs")} */ KESBuilder;

async function init(exclusions) {
    const bstart = performance.now();

	logger.log(" --------------------- ROOT BUILDER --------------------");

    exclusions.push(...config.kes.moduleExclusions);

    logger.sinfo(`[MAIN] Cleaning build output directory...`);

    if (options.force) {
        await cleaner.init(options, [ distDir ]);
    } else {
        const files = await fsp.readdir(options.paths.distDir, { withFileTypes: true });
        const cleanFiles = [
            path.join(options.paths.root, "dist/__server"),
            path.join(options.paths.root, "dist/helpers"),
            path.join(options.paths.root, "dist/kes.user.js"),
            path.join(options.paths.root, "dist/VERSION")
        ];

        for (const ffile of files) {
            const filePath = path.join(options.paths.distDir, ffile.name);
        
            if (ffile.isDirectory()) {
                const hasManifest = fs.readdirSync(filePath, { withFileTypes: true }).some(nfile => nfile.isFile() && nfile.name === config.kes.manifestFile);
                if (!hasManifest) cleanFiles.push(filePath);
            } else {
                cleanFiles.push(filePath);
            }
        }

        await cleaner.init(options, [...new Set(cleanFiles)]);
    }

    logger.ssuccess(`[MAIN] Build output directory cleared.`);
    logger.sinfo(`[MAIN] Processing source modules...`);

    const files = await fsp.readdir(options.paths.srcDir, { withFileTypes: true });
    for (const ffile of files) {
        const filePath = path.join(options.paths.srcDir, ffile.name);
      
        if (ffile.isDirectory()) {
            if (exclusions.includes(ffile.name)) {
                logger.sinfo(`[MAIN] Skipping module '${ffile.name}'.`)
                continue;
            }

            for (const nfile of fs.readdirSync(filePath, { withFileTypes: true })) {
                if (nfile.isFile() && sourceExts.includes(path.extname(nfile.name))) {
                    await moduleBuilder.init([ffile.name], options.force);
                }
            }
        }
    }

    logger.ssuccess(`[MAIN] Finished processing source modules.`);

    //#region Build server
    if (options.dev) {
        logger.sinfo(`[MAIN] Building development server...`);

        const serverDistPath = path.join(options.paths.distDir, "__server");

        if (!fs.existsSync(serverDistPath)) {
            await moduleBuilder.init(["__server"], false);
        }

        logger.ssuccess(`[MAIN] Successfully built development server.`);
    }
    //#endregion

    logger.sinfo(`[MAIN] Generating KES userscript...`);
    await KESBuilder.init(options);

    const bend = performance.now();
    const btime = bend - bstart;
	
	logger.log(" ---------------- ROOT BUILDER FINISHED ---------------");
    logger.slog(`${consoleColors.white(`BUILD SUCCESSFUL IN`)} ${consoleColors.red(`[${formatTime(btime)}]`)}`);
}

function makeCLI() {
    const cli = cac();
    cli.version('1.0.0');
    cli.help();
    cli.option("--debug, -d", "Enables debug mode.");
    cli.option("--dev, -D", "Enables development mode.");
    cli.option("--force, -f", "Forces a rebuild.");
    cli.option("--exclude, -e [module]", "Excludes a module from build.", { type: [String] });

    const args = cli.parse();
    return args;
}

if (require.main === module) {
    cleaner = require("./clean.build.cjs");
    moduleBuilder = require("./build_module.build.cjs");
    KESBuilder = require("./genKES.build.cjs");

    const args = makeCLI();

    console.log(args)

    if (args.options.help) return process.exit(0);

    if (args.options.dev) global._buildOptions.dev = true;
    if (args.options.debug) global._buildOptions.debug = true;
    if (args.options.force) global._buildOptions.force = true;

    if (args.options.exclude && args.options.exclude.some(e => e === "true")) {
        console.error('Usage: node .build.cjs -h');
        process.exit(1);
    }

    let exclusions;
    if (!args.options.exclude) exclusions = [];
    else if (args.options.exclude.length === 1 && args.options.exclude[0] === "undefined") exclusions = [];
    else exclusions = args.options.exclude;

	init(exclusions);
} else {

}