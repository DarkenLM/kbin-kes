# KBin Enhancement Suite (KES) - Rewrite
Original by aclist  
Rewrite by DarkenLM

## What is this?
This repository contains a new workflow in an attempt to create a better development experience compared to the original codebase.

## Why?
When I tried to create a new mod for [KES](https://github.com/aclist/kbin-kes), I found myself frustrated with all the steps required to be able to test the script locally, having to push the changes to github, wait for the github cache to refresh, so I created this new codebase to enable a faster and easier workflow.

## Features
- Local development server.
- Compartmentalized mods on source directory.
- Typescript support.
- Automatic version increment.
- Simple build system.
- Easy development workflow

## Development Workflow

> **WARNING:** This workflow has only been tested on Tampermonkey. There might be some slight changes between script managers.

[Build Config]: ./.build/config.build.cjs#L111

### First start
1. `pnpm run dev`
2. Open the dashboard of your preferred script manager.
3. Create a new script.
4. Copy the contents of the [KES Script](./dist/kes.user.js) to the new script.
5. Save the script.
6. Go to a whitelisted dev instance of kbin (see [Build Config]).
7. Test changes.

> **Note:** If an error like "Failed to fetch the remote resources." appears, try to reload the page. If it still shows the error, try to reinstall the script.

### Regular build
1. `pnpm run dev`
2. Go to a whitelisted dev instance of kbin (see [Build Config]).
3. Click wrench icon on the top right corner.
4. Click on `Install update: <latest version>`.
5. Upgrade script through your script manager.
  - > **Note:** On Tampermonkey, a version ending on a multiple of 10 [e.g: "10", "100", etc] will be recognized as a downgrade. Accept it either way.
6. Refresh page.
7. Test changes.

# Definitions
The definitions defined below are valid throughout the rest of the document.

- **Module:** A directory within the `src` directory containing a KES mod and all other contents that may exist within. E.g: `src/example-mod`.
- **Module name:** The name of the directory of a module.
- **KES mod:** A module containing a valid Manifest and an entry file containing it's entry point.
- **Manifest:** A `manifest.json` file that follows the rules described in [the original KES documentation](https://aclist.github.io/kes/kes_dark.html#_json_manifest). <!-- TODO: Add to custom documentation. -->
- **Entry file:** A source file within a KES mod containing a top-level function with an unique name, defined in the `entrypoint` property of it's manifest.
- **Source file:** Any Javascript or Typescript file.

# Build System
This project uses a custom build system located on the `.build` directory. The system is organized as follows:
- Packages located on `vendor` are third-party packages partially copied from their respective sources with their accompanying licenses, to avoid node_modules cluttering.
- Scripts located on `util` are various utilities used throughout the build system.
- Scripts located on the root level are the various build tasks.

## Tasks

### [Build](./.build/.build.cjs)
The `build` task is the main entry point for a solution build. It builds all modules (except exclusions) and generates a new KES userscript.

**CLI**  
- **Options:**
  - `--debug, -d`: Enables debug mode.
  - `--dev, -D`: Builds the KES userscript in development mode.
  - `--force, -f`: Forcefully builds every module, even if they're up-to-date.
  - `--exclude, -e [module_name]`: Excludes a module from build. Can be used multiple times.

**API**
- *No functions exported.*

### [Artifact Manager](./.build/artifacter.build.cjs)
The `artifacter` task generates manifests for built solutions, as a means to verify the integrety of each build.

**CLI**
- *No commands defined.*

**API**
- **shouldBuildBeUpdated(options: BuildOptions): Promise\<BuildStats\>**
- **createManifestFile(options: BuildOptions): Promise\<void\>**

### [Asset Builder](./.build/assets.build.cjs)
The `assets` task copies asset files to their mirrored location on the solution build.

**CLI**
- *No commands defined.*

**API**
- **init(options: BuildOptions): Promise\<void\>**

### [Module Builder](./.build/build_module.build.cjs)
The `build_module` task builds a single module within the solution. Also triggers a KES rebuild.

**CLI**
- **Options:**
  - `--debug, -d`: Enables debug mode.
  - `--dev, -D`: Builds the KES userscript in development mode.
  - `--force, -f`: Forcefully builds every module, even if they're up-to-date.

**API**
- **init(options: BuildOptions): Promise\<void\>**
- **function checkAndBuildDir(options: BuildOptions, name: string): Promise\<void\>**

### [Cleaner](./.build/clean.build.cjs)
The `clean` task cleans the solution build output directory, and optionally the node_modules directory.

**CLI**
- **Options:**
  - `--debug, -d`: Enables debug mode.
  - `--clean-node-modules`: Deletes the node_modules directory.

**API**
- **init(options: BuildOptions): Promise\<void\>**

### [KES Usercript Generator](./.build/genKES.build.cjs)
The `genKES` task generates a new KES userscript with the currently built modules.

**CLI**
- **Options:**
  - `--debug, -d`: Enables debug mode.
  - `--dev, -D`: Builds the KES userscript in development mode.

**API**
- **init(options: BuildOptions): Promise\<void\>**

### [Postprocessor](./.build/postprocess.build.cjs)
The `postprocess` runs postprocessing commands on a solution build:
- Correct imports when targeting ESNext.
- Remove [Ephemeral Imports](#ephemeral-imports).

**CLI**
- *No commands defined.*

**API**
- **init(options: BuildOptions): Promise\<void\>**

## Ephemeral Imports
In order for functions defined on the original KES lib, types have been provided on [`types/kes`](./types/kes/index.d.ts), which can be accessed on typescript mods through `@kes`. Those imports are then removed from the built module automatically.

In order to create an ephemeral import:
1. Open the `tsconfig.json` file.
2. Add a new property to the `compilerOptions->paths` option: `"@<namespace>/*": ["types/<namespace>/*"]` (replace `<namespace>` with any other unique name).
3. Add a new element to the `.build->ephemeralPaths` option: `"@<namespace>/*"` (replace `<namespace>` with the unique name defined on the previous step).