/**
 * Module builder
 * 
 * Builds a specific module from the solution.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const esbuild = require("esbuild");
const { cac } = require("cac");

const { init: postprocess } = require("./postprocess.build.cjs");
const { init: clean } = require("./clean.build.cjs");
const { init: build_assets } = require("./assets.build.cjs");
const artifacter = require("./artifacter.build.cjs");
const { logger } = require("./util/log.cjs");
require("./config.build.cjs");

const rootDir = path.join(__dirname, '../');

/**
 * Attempts to build a module, if it exists.
 *
 * @param {import('./types.build.cjs').BuildOptions} options
 * @param {string} name
 */
async function checkAndBuildDir(options, name) {
	const targetDir = path.join(options.paths.srcDir, name);

	if (!fs.existsSync(targetDir)) {
		logger.serror(`[MODULE BUILDER] Module '${name}' not found in the source code.\n- ENOENT: no such file or directory, open '${targetDir}'`);
		process.exit(1);
	}

	logger.info(`[MODULE BUILDER] Building module '${name}'...`);
	const allFiles = await fsp.readdir(targetDir);
	const files = allFiles
		.filter(f => f.endsWith(".ts") || f.endsWith(".cts") || f.endsWith(".mts"))
		.map(f => `src${path.sep}${name}${path.sep}${f}`);

	await esbuild.build({
		entryPoints: files,
		outdir: options.paths.distDir,
		tsconfig: path.join(__dirname, "../tsconfig.json")
	})
}

async function runPre(options) {
	try {
		await clean(options, [options.paths.distDir]);
	} catch (error) {
		logger.serror('[MODULE BUILDER] Failed to execute one or more of the pre commands.');
		logger.serror(error)
		process.exit(1);
	}
}

async function runPost(options, name) {
	try {
        await build_assets({
            paths: {
                srcDir: path.join(options.paths.srcDir, name),
                distDir: options.paths.distDir
            }
        });
		await postprocess(options);
	} catch (error) {
		logger.serror('[MODULE BUILDER] Failed to execute one or more of the post commands.');
        logger.serror(error)
		process.exit(1);
	}
}

async function init(args, force) {
	if (args.length < 1) {
		logger.serror('[MODULE BUILDER] Usage: node build_module.build.cjs --help');
		process.exit(1);
	}

    let name = args[0];

	const options = {
		paths: {
			root: rootDir,
			distDir: path.join(rootDir, "dist", name),
			srcDir: path.join(rootDir, "src")
		},
	}

	await fsp.mkdir(options.paths.distDir, { recursive: true });
    
    const aOptions = {
        paths: {
            root: options.paths.rootDir,
			distDir: options.paths.distDir,
			srcDir: path.join(options.paths.srcDir, name)
        }
    }
	const shouldUpdate = await artifacter.shouldBuildBeUpdated(aOptions);

	if (force || shouldUpdate.src || shouldUpdate.dist) {
        if (force) logger.sinfo(`[MODULE BUILDER] Forcefully rebuilding module '${name}'.`);
        else if (!fs.existsSync(options.paths.distDir)) logger.sinfo(`[MODULE BUILDER] Module '${name}' is not built. Building.`);
		else if (shouldUpdate.src) logger.sinfo(`[MODULE BUILDER] Module '${name}' is outdated. Rebuilding.`);
		else logger.sinfo(`[MODULE BUILDER] Module '${name}' is damaged. Rebuilding.`);

		await runPre(options);
		await checkAndBuildDir(options, name);
		await runPost(options, name);	

		logger.info(`[MODULE BUILDER] Generating build manifest file...`);
		await artifacter.createManifestFile(aOptions);
		logger.ssuccess(`[MODULE BUILDER] Successfully built module.`);
	} else {
		logger.swarn(`[MODULE BUILDER] Module '${name}' is up-to-date. Skipping.`);
	}
}

function makeCLI() {
    const cli = cac();
    cli.version('1.0.0');
    cli.help();
    cli.option("--debug, -d", "Enables debug mode.");
    cli.option("--dev, -D", "Enables development mode.");
    cli.option("--force, -f", "Forces a rebuild.");

    const args = cli.parse();
    return args;
}

if (require.main === module) {
    ;(async () => {
        const args = makeCLI();

        if (args.options.help) return process.exit(1);

        if (args.options.dev) global._buildOptions.dev = true;
        if (args.options.debug) global._buildOptions.debug = true;
        if (args.options.force) global._buildOptions.force = true;

        await init(args.args, args.options.force);

        const KESBuilder = require("./genKES.build.cjs");
        await KESBuilder.init(global._buildOptions)
    })();
} else {
    module.exports.init = init
    module.exports.checkAndBuildDir = checkAndBuildDir;
}