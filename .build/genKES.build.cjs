/**
 * KES Build Script
 * 
 * This file generates a ready KES userscript.
 * 
 * Partially adapted from https://github.com/aclist/kbin-kes/blob/main/gen.sh
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const { config, options } = require("./config.build.cjs");
const {
    libDir,
    helpersDir,
    distReservedDirs,
    moduleExclusions,
    name,
    author,
    license,
    versionFile,
    versionFilePath,
    version,
    desc,
    base_file,
    output_file,
    manifest,
    github,
    instances,
    devInstances,
    grants
} = config.kes;
const { logger } = require("./util/log.cjs");

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const dedent = require("./vendor/dedent/dedent.cjs");
const { cac } = require("cac");

function addLine(stream, key, argument) {
    stream.write(`// @${key} ${argument}\n`)
}

async function makeManifest(options) {
    try {
        logger.info("[KES] Attempting to generate KES manifest...");

        logger.info(`[KES] Reading solution build module candidates...`);
        const files = await fsp.readdir(options.paths.distDir, { withFileTypes: true })
        logger.success("Successfully read modules.");

        logger.info("[KES] Processing candidates...");
        const manifestData = [];
        for (const ffile of files) {
            const filePath = path.join(options.paths.distDir, ffile.name);
            logger.info(`[KES] Attempting to process candidate '${ffile.name}'...`);
        
            if (ffile.isDirectory()) {
                if (distReservedDirs.includes(ffile.name)) {
                    logger.warn(`[KES] Candidate is a reserved directory. Skipping.`);
                    continue;
                }

                const hasManifest = fs.readdirSync(filePath, { withFileTypes: true }).some(nfile => nfile.isFile() && nfile.name === config.kes.manifestFile);
                if (hasManifest) {
                    logger.warn(`[KES] Candidate is a module. Processing.`);

                    let str = path.join(options.paths.distDir, ffile.name, config.kes.manifestFile);

                    const fileData = await fsp.readFile(str, { encoding: "utf8" });
                    const data = JSON.parse(fileData);
                    manifestData.push(data);
                    logger.success(`[KES] Successfully processed candidate.`);
                } else {
                    logger.warn(`[KES] Candidate is not a module. Skipping.`);
                }
            } else {
                logger.warn(`[KES] Candidate is not a module. Skipping.`);
            }
        }
        logger.success(`[KES] Successfuly processed ${manifestData.length} modules.`);

        const manifestPath = path.join(options.paths.distDir, manifest);

        logger.info(`[KES] Writting KES manifest to '${manifestPath}'`);
        await fsp.mkdir(path.dirname(manifestPath), { recursive: true })
        await fsp.writeFile(manifestPath, JSON.stringify(manifestData, null, 4), { encoding: "utf8" });
        logger.success(`[KES] Successfully wrote KES manifest.`);

        return manifestData.filter(m => "entrypoint" in m).map(m => m.entrypoint).sort();
    } catch (e) {
        logger.serror("[KES] Error creating the manifest file:", e);
        return;  
    }
}

async function createKES(options) {
    const filePath = path.join(options.paths.distDir, output_file);
    const modules = [output_file];

    logger.info(`[KES] Copying version file...`);
    await fsp.copyFile(versionFilePath, path.join(options.paths.distDir, versionFile));
    modules.push(versionFile)

    logger.info(`[KES] Creating KES script file stream...`);
    const file = fs.createWriteStream(filePath, { encoding: "utf8" });

    logger.info(`=== KES HEADER ===`);

    file.write("// ==UserScript==\n");

    logger.info(`[KES] Writing author metadata...`);
    file.write(dedent`// @name	${name}
        // @namespace	https://github.com/${author}
        // @license	${license}
        // @version	${version}
        // @description	${desc}
        // @author	${author}
    `);
    file.write("\n")

    logger.info(`[KES] Writing instance whitelist...`);
    // Instance URLs
    if (options.dev) {
        for (const instance of devInstances) {
            addLine(file, "match", instance)
        }
    } else {
        for (const instance of instances) {
            addLine(file, "match", instance)
        }
    }

    //#region Grants
    logger.info(`[KES] Writing permission grants...`);

    for (let i = 0; i < grants.length; i++) {
        let str = `GM_${grants[i]}`;
        addLine(file, "grant", str);
    }
    
    for (let i = 0; i < grants.length; i++) {
        let grant = grants[i];

        if (grant === "xmlhttpRequest") {
          grant = "xmlHttpRequest";
        }
        if (grant === "getResourceText") {
          continue;
        }

        let str = `GM.${grant}`;
        addLine(file, "grant", str);
    }
    //#endregion

    // Extra metadata
    logger.info(`[KES] Writing extra metadata...`);
    file.write(dedent`
        // @icon	https://kbin.social/favicon.svg
    `)
    file.write("\n")

    if (!options.dev) {
        file.write(dedent`
            // @connect	raw.githubusercontent.com
            // @connect	github.com
        `)
        file.write("\n")
    }

    //#region Requires
    logger.info(`[KES] Writing module imports...`);
    const prefix = options.dev 
        ? config.kes.devServer
        : `https://github.com/${github.slug}/raw/${github.branch}/${options.paths.distDir.replace(options.paths.root, "").replaceAll("\\", "/")}/`;
    const deps = config.kes.localDependencies;
    const external = config.kes.externalDependencies;
    const resources = {
        kes_layout: "ui.json",
        kes_css: "kes.css",
        kes_json: config.kes.manifestFile
    };

    logger.info(`[KES] Require prefix is '${prefix}'.`);
    
    logger.info(`[KES] Adding built-in dependencies...`);
    for (const dep of deps) {
        logger.info(`[KES] Processing dependency '${dep}'...`);

        let str = `${prefix}${helpersDir.replaceAll("\\", "/")}/${dep}`;
        const helpersPath = path.join(options.paths.distDir, helpersDir);

        await fsp.mkdir(helpersPath, { recursive: true });
        await fsp.copyFile(path.join(options.paths.root, libDir, helpersDir, dep), path.join(helpersPath, dep));

        addLine(file, "require", str);
        logger.success(`[KES] Successfully processed dependency.`);
    };

    logger.info(`[KES] Adding external dependencies...`);
    for (const ext of external) {
        addLine(file, "require", ext);
        logger.success(`[KES] Successfully processed external dependency '${ext}'`);
    };

    logger.info(`[KES] Adding module imports...`);
    const files = await fsp.readdir(options.paths.distDir, { withFileTypes: true })

    for (const ffile of files) {
        const filePath = path.join(options.paths.distDir, ffile.name);
      
        if (ffile.isDirectory()) {
            for (const nfile of fs.readdirSync(filePath, { withFileTypes: true })) {
                if (nfile.isFile() && path.extname(nfile.name) === ".js") {
                    let str = `${prefix}${ffile.name}/${nfile.name}`;

                    if (!distReservedDirs.includes(ffile.name)) addLine(file, "require", str);
                    if (!moduleExclusions.includes(ffile.name)) modules.push(path.join(ffile.name, nfile.name));
                }
            }
        }
    }

    logger.info(`[KES] Writing resource imports...`);
    for (const key in resources) {
        let str = `${key} ${prefix}${helpersDir.replaceAll("\\", "/")}/${resources[key]}`;
        addLine(file, "resource", str);

        if (path.basename(resources[key]) === config.kes.manifestFile) continue;

        const respath = path.join(options.paths.root, libDir, helpersDir, resources[key]);
        const distRespath = path.join(options.paths.distDir, helpersDir, resources[key]);

        await fsp.copyFile(respath, distRespath)

        modules.push(path.join(helpersDir, resources[key]));
    }

    addLine(file, "downloadURL", `${prefix}${output_file}`);
    addLine(file, "updateURL", `${prefix}${output_file}`);
    //#endregion

    file.write("// ==/UserScript==\n");

    logger.info(`=== KES CONTENT ===`);

    //#region MastHead
    logger.info(`[KES] Writing auto masthead...`);
    file.write("\n//START AUTO MASTHEAD\n");

    let funcs = await makeManifest(options);
    modules.push(path.join(manifest));

    let eslint_funcs = [...funcs, 'safeGM', 'getHex'];

    file.write(`/* global ${eslint_funcs.join(', ')} */\n\n`);

    logger.info(`[KES] Writing code header...`);
    if (options.dev) {
        file.write(dedent`
            const version = safeGM("info").script.version;
            const tool = safeGM("info").script.name;
            const repositoryURL = "${prefix.replaceAll("\\", "\\\\")}";
            const helpersPath = "${helpersDir.replaceAll("\\", "/")}/"
            const versionFile = repositoryURL + "VERSION";
            const updateURL = repositoryURL + "kes.user.js";
            const bugURL = "https://example.com";
            const changelogURL = "https://example.com";
            const magURL = "https://kbin.social/m/enhancement"

            //resource URLs used by legacy GM. API
            const manifest = repositoryURL + helpersPath + "${config.kes.manifestFile}"
            const cssURL = repositoryURL + helpersPath + "kes.css"
            const layoutURL = repositoryURL + helpersPath + "ui.json"
        `)
    } else {
        file.write(dedent`
            const version = safeGM("info").script.version;
            const tool = safeGM("info").script.name;
            const repositoryURL = "https://github.com/${github.slug}/";
            const branch = "${github.branch}"
            const helpersPath = "${helpersDir.replaceAll("\\", "/")}/"
            const branchPath = repositoryURL + "raw/" + branch + "/" + "${github.buildDir}" + "/"
            const versionFile = branchPath + "VERSION";
            const updateURL = branchPath + "kes.user.js";
            const bugURL = repositoryURL + "issues"
            const changelogURL = repositoryURL + "blob/" + branch + "/CHANGELOG.md"
            const magURL = "https://kbin.social/m/enhancement"

            //resource URLs used by legacy GM. API
            const manifest = branchPath + helpersPath + "${config.kes.manifestFile}"
            const cssURL = branchPath + helpersPath + "kes.css"
            const layoutURL = branchPath + helpersPath + "ui.json"
        `)
    }
    file.write("\n\n")

    logger.info(`[KES] Writing module entrypoint mapper...`);
    file.write("const funcObj = {\n");
    for (let i = 0; i < funcs.length; i++) {
        const comma = i < funcs.length - 1 ? ',' : '';
        file.write(`    ${funcs[i]}: ${funcs[i]}${comma}\n`);
    }
    file.write("};\n");

    file.write("//END AUTO MASTHEAD\n\n");
    //#endregion

    if (options.dev) {
        logger.info(`[KES] Processing and adding development server...`);
        const serverPath = path.join(options.paths.distDir, "__server");

        if (!fs.existsSync(serverPath)) {
            logger.error(`[KES] Cannot create modules file: Server is not built.`);
            process.exit(1);
        }

        await fsp.writeFile(path.join(serverPath, "modules.json"), JSON.stringify(modules, null, 4), { encoding: "utf8" });
    }

    //#region KES Script
    logger.info(`[KES] Writing kes library script...`);
    const kesFilePath = path.join(options.paths.root, libDir, base_file);
    const kesFileData = await fsp.readFile(kesFilePath, { encoding: "utf8" });
    file.write(kesFileData)
    //#endregion

    logger.ssuccess("Successfully generated KES userscript.");
}

async function init(options) {
    logger.log(" --------------- KES BUILDER --------------");
    logger.info(`[KES] Building KES on ${options.dev ? "DEV" : "PROD"} mode.`);
    await createKES(options);
    logger.log(" ----------- KES BUILDER FINISHED ----------");
}

function makeCLI() {
    const cli = cac();
    cli.version('1.0.0');
    cli.help();
    cli.option("--debug, -d", "Enables debug mode.");
    cli.option("--dev, -D", "Enables development mode.");

    const args = cli.parse();
    return args;
}

if (require.main === module) {
    const args = makeCLI();

    if (args.options.help) return process.exit(1);

    if (args.options.dev) {
        global._buildOptions.dev = true;
    }
    
	init(global._buildOptions);
} else {
    module.exports.init = init
    // module.exports.libDir = libDir;
    // module.exports.helpersDir = helpersDir;
    // module.exports.distReservedDirs = distReservedDirs;
    // module.exports.output_file = output_file;
}