let electron = require("electron");
let fs = require("fs");
let path = require("path");
//#region src/electron/preload.ts
var version;
try {
	const packagePath = (0, path.join)(__dirname, "..", "..", "package.json");
	version = JSON.parse((0, fs.readFileSync)(packagePath, "utf-8")).version;
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
//#endregion
