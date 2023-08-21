/**
 * Config
 * 
 * Defines all configurations for all build modules.
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const path = require("path");
const { getOwner, getRootedPath, readFile, executeCmd } = require("./util/KESUtil.cjs");

/** The global config for all build tasks. */
const config = {
    //#region Global

    /** The working directory for all build tasks. */
    defaultRootPath: path.join(__dirname || process.cwd(), "../"),
    /** The solution build output directory, relative to the root path. */
    distDir: "dist",
    /** The solution source directory, relative to the root path. */
    srcDir: "src",
    /** The file extensions that represent a source file within the build process. */
    sourceExts: [".ts", ".mts", ".js", ".cjs"],
    //#endregion

    //#region Artifacter
    /** Configuration for the Artifacter task. */
    artifacter: {
        /** The name for the build manifest file. */
        manifestFile: "build.manifest.json"
    },
    //#endregion

    //#region Assets
    /** Configuration for the Asset Build task. */
    assets: {
        /** File names to be ignored. */
        ignoreFiles: [".eslintrc", ".eslintignore"],
        /** File extensions to be ignored. */
        ignoreExts: [".ts", ".mjs", ".ignore"]
    },
    //#endregion

    //#region KES
    /** Configuration for the Generate KES Script task. */
    kes: {
        /** The library directory, relative to the root path. */
        libDir: "lib",
        /** The helpers directory, relative to the lib path. */
        helpersDir: "helpers",
        /** Internally used directories within the solution build output directory, to be not interpreted as a module. */
        distReservedDirs: [], // PostDec computed
        /** Modules to be ignored by the development server. */
        moduleExclusions: ["__server"],

        /** The name of the KES Script. */
        name: "KES DEV",
        /** The author of the KES Script. */
        author: "DarkenLM",
        /** The licence used on the KES Script. */
        license: "MIT",
        /** The version file name to fetch the KES Script version. */
        versionFile: "VERSION",
        /** The version source file containing the KES Script version. */
        versionFilePath: "", // PostDec computed
        /** 
         * The KES Script version. 
         * 
         * **Automatically computed. Manual definition will be overwritten.**
         */
        version: "", // PostDec computed
        /** The description for the KES Script. */
        desc: "Kbin Enhancement Suite - Development",
        
        github: {
            /** The git branch used for the production-ready KES Script. */
            branch: "", // PostDec computed
            /** The name of the github directory. */
            name: "kbin-kes",
            /** The owner of the github repository for the production-ready script. */
            owner: "", // PostDec computed
            /** 
             * The github slug url part.
             * 
             * **Automatically computed. Manual definition will be overwritten.**
             */
            slug: "", // PostDec computed
        },
        /** The source file for the KES Script, relative to the lib path. */
        base_file: "kes.js",
        /** The KES Script file name. */
        output_file: "kes.user.js",
        /** The name of the manifest file to be used throughout the development cycle. */
        manifestFile: "manifest.json",
        /** 
         * The manifest file path. 
         * 
         * **Automatically computed. Manual definition will be overwritten.**
         */
        manifest: "", // PostDec computed
        /** The instance whitelist for the production-ready KES Script */
        instances: [
            "https://kbin.social/*",
            "https://lab2.kbin.pub/*",
            "https://lab3.kbin.pub/*",
            "https://fedia.io/*",
            "https://karab.in/*",
            "https://kbin.cafe/*"
        ],
        /** The instance whitelist for the development KES Script */
        devInstances: [
            "https://kbin.cafe/*"
        ],
        /** The Userscript permission grants for the KES Script. */
        grants: [
            "addStyle",
            "getResourceText",
            "xmlhttpRequest",
            "info",
            "getValue",
            "setValue",
            "getResourceText",
            "setClipboard"
        ],

        /** The development server URL. */
        devServer: `http://localhost:3000/`,
        /** The local dependencies of the KES Script, relative to the helpers path. */
        localDependencies: ["safegm.user.js"],
        /** The URLs for external dependencies of the KES Script */
        externalDependencies: [
            "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js",
            "http://code.jquery.com/jquery-3.4.1.min.js"
        ]
    }
    //#endregion
}

/** 
 * The global options for all build tasks. 
 * @type {import("./types.build.cjs").BuildOptions}
 * */
const options = {
	paths: {
		root: config.defaultRootPath,
		distDir: path.resolve(path.join(config.defaultRootPath, config.distDir)),
		srcDir: path.resolve(path.join(config.defaultRootPath, config.srcDir))
	},
    debug: false,
    dev: false,
    force: false,
}
global._buildOptions = options;

// Config Post-Declaration computed properties
config.kes.distReservedDirs = [config.kes.helpersDir, "__server"]
config.kes.versionFilePath = getRootedPath(options, path.join(config.kes.libDir, config.kes.versionFile));
config.kes.version = readFile(config.kes.versionFilePath);
config.kes.manifest = `./${config.kes.helpersDir}/${config.kes.manifestFile}`
config.kes.github.branch = executeCmd("git branch --show-current", false).replace("\n", "") ?? null;
config.kes.github.owner = getOwner(true);
config.kes.github.slug = `${config.kes.github.owner}/${config.kes.github.name}`;

module.exports.config = config;
module.exports.options = options;