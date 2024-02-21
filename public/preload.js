const { app, contextBridge, ipcRenderer } = require('electron')
const version = require('../package.json').version

contextBridge.exposeInMainWorld('electron', {
    invoke: (a, b) => ipcRenderer.invoke(a, b),
    send: (channel, args) => ipcRenderer.send(channel, args),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    removeListener: (channel) => ipcRenderer.removeAllListeners(channel),
    ver: () => version
})