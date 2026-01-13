import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read version from package.json
let version: string;
try {
    const packagePath = join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    version = packageJson.version;
} catch (error) {
    version = '0.0.0';
}

export interface ElectronAPI {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
    receive: (channel: string, func: (...args: any[]) => void) => void;
    removeListener: (channel: string) => void;
    ver: () => string;
}

contextBridge.exposeInMainWorld('electron', {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
    receive: (channel: string, func: (...args: any[]) => void) =>
        ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: any[]) => func(...args)),
    removeListener: (channel: string) => ipcRenderer.removeAllListeners(channel),
    ver: () => version,
} as ElectronAPI);
