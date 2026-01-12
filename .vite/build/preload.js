"use strict";
const electron = require("electron");
const fs = require("fs");
const path = require("path");
let version;
try {
  const packagePath = path.join(__dirname, "..", "..", "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
  version = packageJson.version;
} catch (error) {
  version = "0.0.0";
}
electron.contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, ...args) => electron.ipcRenderer.invoke(channel, ...args),
  send: (channel, ...args) => electron.ipcRenderer.send(channel, ...args),
  receive: (channel, func) => electron.ipcRenderer.on(channel, (_event, ...args) => func(...args)),
  removeListener: (channel) => electron.ipcRenderer.removeAllListeners(channel),
  ver: () => version
});
