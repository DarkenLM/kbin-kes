"use strict";
import fs from "fs";
const fsp = fs.promises;
import path from "path";
import polka from "polka";
import url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
async function readConfig(filename) {
  const configPath = path.join(__dirname, filename);
  if (!fs.existsSync(configPath))
    throw new Error("ENOENT: Missing config.json file.");
  const fileData = await fsp.readFile(configPath, { encoding: "utf8" });
  const configData = JSON.parse(fileData);
  return configData;
}
class ServerManager {
  app;
  configFile;
  config;
  modulesFile;
  modules;
  starter;
  #restarting;
  constructor(files, starter) {
    this.app = void 0;
    this.configFile = files.config;
    this.modulesFile = files.modules;
    this.starter = starter;
    this.#restarting = false;
  }
  started() {
    return !!this.app;
  }
  configurated() {
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
    if (!this.configurated())
      return;
    this.app = await this.starter(this.config, this.modules);
    this.#restarting = false;
    return this.app;
  }
  async close() {
    return new Promise((resolve, reject) => {
      if (!this.started())
        return;
      this.app.server?.close((err) => {
        if (err)
          return reject(err);
        resolve();
      });
    });
  }
  async restart() {
    if (!this.configurated())
      return;
    if (!this.started())
      return;
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
async function start(config, modulesList) {
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
;
(async () => {
  const manager = new ServerManager({ config: "config.json", modules: "modules.json" }, start);
  await manager.populate();
  await manager.start();
})();
