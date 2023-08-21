/**
 * Automatic KES version incrementer.
 * 
 * Usage: node versionIncrement.cjs --help
 * 
 * Copyright (c) 2023 DarkenLM https://github.com/DarkenLM
 */

const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const cac = require("cac");

const VersionKind = {
    MAJOR: 0,
    MINOR: 1,
    PATCH: 2,
    PRERELASE: 3,
    LAST: 4
}

const VersionKindMapper = {
    [VersionKind.MAJOR]: "MAJOR",
    [VersionKind.MINOR]: "MINOR",
    [VersionKind.PATCH]: "PATCH",
    [VersionKind.PRERELASE]: "PRERELASE",
    [VersionKind.LAST]: "LAST"
}


/**
 * @typedef {Object} IncrementVersionOptions
 * @property {string} name The name of the prerelease tag to be used. Will NOT override the existing one.
 */

/**
 * Increments a part of a given version string, given it's kind.
 *
 * @param {string} currentVersion
 * @param {number} kind The version part to increment, through a {@link VersionKind}.
 * @param {IncrementVersionOptions} options The options to be used.
 * @return {string} 
 */
function incrementVersion(currentVersion, kind, options) {
    const components = currentVersion.split(".");

    switch (kind) {
        case VersionKind.MAJOR: {
            const firstComp = components[0];
            let ver = parseInt(firstComp, 10);

            components.splice(0, 1, `${++ver}`);
            break;
        }
        case VersionKind.MINOR: {
            if (components.length > 1) {
                const midComp = components[1];
                let ver = parseInt(midComp, 10);

                components.splice(1, 1, `${++ver}`);
            } else {
                components.push("1");
            }
            break;
        }
        case VersionKind.PATCH: {
            if (components.length > 2) {
                const lastComp = components[2];
                let newLastComp;

                if (lastComp.includes("-")) {
                    const parts = lastComp.split("-");
                    let firstPart = parts[0];

                    parts.splice(0, 1, ++firstPart);
                    newLastComp = parts.join("-");
                } else {
                    const midComp = components[2];
                    let ver = parseInt(midComp, 10);

                    newLastComp = `${++ver}`;
                }

                components.splice(2, 1 , newLastComp);
            } else {
                if (components.length === 1) components.push("0");
                components.push("1");
            }
            break;
        }
        case VersionKind.PRERELASE: {
            if (components.length > 2) {
                const lastComp = components.at(-1);
                let newLastComp;

                if (lastComp.includes("-")) {
                    const parts = lastComp.split("-");
                    let lastPart = parts.at(-1);

                    const partMatch = lastPart.match(/([a-zA-Z_]+)(\d+)$/);

                    if (partMatch) {
                        const prerelease = partMatch[1];
                        let ver = parseInt(partMatch[2], 10);

                        lastPart = `${prerelease}${++ver}`;
                    } else {
                        lastPart = `${lastPart}2`;
                    }

                    parts.splice(parts.length - 1, 1, lastPart);
                    newLastComp = parts.join("-");
                } else {
                    newLastComp = `${lastComp}-${options.name}1`;
                }

                components.splice(components.length - 1, 1 , newLastComp);
            } else {
                if (components.length === 1) components.push("0");
                components.push(`0-${options.name}1`);
            }
            break;
        }
        case VersionKind.LAST: {
            const lastComp = components.at(-1);
            let newLastComp;

            if (lastComp.includes("-")) {
                const parts = lastComp.split("-");
                let lastPart = parts.at(-1);

                const partMatch = lastPart.match(/([a-zA-Z_]+)(\d+)$/);

                if (partMatch) {
                    const prerelease = partMatch[1];
                    let ver = parseInt(partMatch[2], 10);

                    lastPart = `${prerelease}${++ver}`;
                } else {
                    lastPart = `${lastPart}2`;
                }

                parts.splice(parts.length - 1, 1, lastPart);
                newLastComp = parts.join("-");
            } else {
                let ver = parseInt(lastComp, 10);

                newLastComp = `${++ver}`;
            }

            components.splice(components.length - 1, 1 , newLastComp);
            break;
        }
    }

    return components.join(".");
}

function makeCLI() {
    const cli = cac();
    cli.version("1.0.0");
    cli.help();
    cli.option("--file, -f <file>", "The version file to update.", { default: path.join(__dirname, "../../lib/VERSION") })
    cli.option("--create, -c", "Creates the version file if non-existent.", { default: false })
    cli.command("major", "Increments the major version component.")
        .action((args) => {
            init(VersionKind.MAJOR, { file: args.file, create: args.create });
        });
    cli.command("minor", "Increments the minor version component.")
        .action((args) => {
            init(VersionKind.MINOR, { file: args.file, create: args.create });
        });
    cli.command("patch", "Increments the patch version component.")
        .action((args) => {
            init(VersionKind.PATCH, { file: args.file, create: args.create });
        });
    cli.command("prerelease", "Increments the prerelease version component.")
        .option("--name, -n <name>", "The name of the prerelease to insert.", { default: "dev" })
        .action((args) => {
            init(VersionKind.PRERELASE, { name: args.name, file: args.file, create: args.create });
        });
    cli.command("last", "Increments the last version component.")
        .action((args) => {
            init(VersionKind.LAST, { file: args.file, create: args.create });
        });

    const args = cli.parse();
    return args;
}


async function init(kind, options) {
    let filePath;
    if (path.isAbsolute(options.file)) filePath = options.file;
    else filePath = path.join(__dirname, "../../", options.file);

    if (!fs.existsSync(filePath) && !options.create) {
        console.error(`File '${filePath}' does not exist. Use 'the --create' flag to create the file.`)
        process.exit(1);
    }

    const currentVersion = await fsp.readFile(filePath, { encoding: "utf8" });
    if (currentVersion.split("\n").length > 1) {
        console.error(`File '${filePath}' is not a version file.`)
        process.exit(1);
    }

    console.log("Current version:", currentVersion)

    const newVersion = incrementVersion(currentVersion, kind, options);
    await fsp.writeFile(filePath, newVersion, { encoding: "utf8" });

    console.log(`Version updated to: ${newVersion}`);
}

if (require.main === module) {
    makeCLI();
} else {
    module.exports.init = init;
    module.exports.incrementVersion = incrementVersion;
    module.exports.VersionKind = VersionKind;
    module.exports.VersionKindMapper = VersionKindMapper;
}
