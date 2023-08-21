import fs from "fs";
const fsp = fs.promises;
import path from "path";
import polka from "polka";
import url from "url";

interface Config {
    PORT: number
}

type AppStarter = (config: Config, modules: string[]) => Promise<NonNullable<ServerManager["app"]>>

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

async function readConfig<T>(filename: string): Promise<T> {
    const configPath = path.join(__dirname, filename);
    if (!fs.existsSync(configPath)) throw new Error("ENOENT: Missing config.json file.");

    const fileData = await fsp.readFile(configPath, { encoding: "utf8" });
    const configData = JSON.parse(fileData);

    return configData;
}

class ServerManager {
    app: polka.Polka | undefined;
    configFile: string;
    config: Config | undefined;
    modulesFile: string;
    modules: string[] | undefined;
    starter: AppStarter;
    #restarting: boolean;

    constructor(files: { config: string, modules: string }, starter: AppStarter) {
        this.app = undefined;
        this.configFile = files.config;
        this.modulesFile = files.modules;
        this.starter = starter;

        this.#restarting = false;
    }

    started(): this is { app: NonNullable<ServerManager["app"]> } {
        return !!this.app;
    }

    configurated(): this is { config: NonNullable<ServerManager["config"]>, modules: NonNullable<ServerManager["modules"]> } {
        return !!this.config && !!this.modules;
    }

    get restarting() {
        return this.#restarting;
    }

    async populate() {
        this.config = await readConfig(this.configFile);
        this.modules = await readConfig(this.modulesFile);
    }

    async start() {
        if (!this.configurated()) return;

        this.app = await this.starter(this.config, this.modules);

        this.#restarting = false;
        return this.app;
    }

    async close() {
        return new Promise<void>((resolve, reject) => {
            if (!this.started()) return;

            this.app.server?.close((err) => {
                if (err) return reject(err);

                resolve();
            });
        });
    }

    async restart() {
        if (!this.configurated()) return;
        if (!this.started()) return;

        this.#restarting = true;

        if (this.app.server) {
            try {
                await this.close();
                await this.start();
            } catch (e) {
                await this.start();
            }
        } else {
            await this.start();
        } 
    }
}

async function start(config: Config, modulesList: string[]) {
    const app = polka();

    app.get("*", async (req, res) => {
        try {
            const reqPath = req.path.substring(1);
            const basePath = path.join(__dirname, "..");
            const requestedFilePath = path.join(basePath, reqPath);
            const reqPathCorrected = requestedFilePath.replace(basePath, "").substring(1);

            console.log("REQUESTED FILE:", [reqPath]);
            if (modulesList.includes(reqPathCorrected) && fs.existsSync(requestedFilePath)) {
                const fileStream = fs.createReadStream(requestedFilePath);
                fileStream.pipe(res);
            } else {
                res.statusCode = 404;
                res.end("File not found");
            }
        } catch (err) {
            console.error("Error:", err);
            res.statusCode = 500;
            res.end("Internal Server Error");
        }
    });
    
    app.listen(config.PORT, () => {
        console.log(`KES Server is running on http://localhost:${config.PORT}`);
    });

    return app;
}


// eslint-disable-next-line @typescript-eslint/no-extra-semi
;(async () => {
    const manager = new ServerManager({ config: "config.json", modules: "modules.json" }, start);

    await manager.populate();
    await manager.start();
})();