"use strict";
const { contextBridge, ipcRenderer } = require("electron");
const { readFileSync } = require("fs");
const { join } = require("path");
let version;
try {
  const packagePath = join(__dirname, "..", "..", "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
  version = packageJson.version;
} catch (error) {
  version = "0.0.0";
}
contextBridge.exposeInMainWorld("electron", {
  invoke: (a, b) => ipcRenderer.invoke(a, b),
  send: (channel, args) => ipcRenderer.send(channel, args),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  removeListener: (channel) => ipcRenderer.removeAllListeners(channel),
  ver: () => version
});
