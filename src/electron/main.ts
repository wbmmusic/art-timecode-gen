import { app, BrowserWindow, ipcMain, protocol, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import { fork, ChildProcess } from 'child_process';
import { autoUpdater } from 'electron-updater';
import { EventEmitter } from 'events';
import path from 'path';

// Declare Vite global variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

interface ArtNetMessage {
    cmd: 'time' | 'rate' | 'state' | 'speed' | 'output' | 'consoleAddress';
    clock?: any;
    rate?: number;
    state?: string;
    speed?: number;
    output?: any;
    time?: any;
    address?: string;
}

const myEmitter = new EventEmitter();
const windowWidth = 300;
let win: BrowserWindow | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

// SECOND INSTANCE
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) win.restore();
            win.focus();
        }
    });
}
// END SECOND INSTANCE

// Updated path for artNetTc.js in Forge structure
const artNetPath = app.isPackaged
    ? join(process.resourcesPath, 'artNetTc.js')
    : join(__dirname, '..', '..', 'public', 'artNetTc.js');

const artNet: ChildProcess = fork(artNetPath, { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
artNet.stdout?.pipe(process.stdout);
artNet.stderr?.pipe(process.stdout);

const createWindow = (): void => {
    // Create the browser window.
    win = new BrowserWindow({
        width: windowWidth,
        height: 280,
        autoHideMenuBar: true,
        show: false,
        title: 'ArtTimecode Gen v' + app.getVersion(),
        transparent: true,
        frame: false,
        resizable: false,
        hasShadow: false,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            sandbox: false,
        },
    });

    // In development, load from Vite dev server
    // In production, load from built files
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Emitted when the window is closed.
    win.on('closed', () => app.quit());
    win.on('ready-to-show', () => win?.show());

    // Open DevTools in development
    if (!app.isPackaged) {
        // win.webContents.openDevTools();
    }
};

app.on('ready', () => {
    protocol.registerFileProtocol('atom', (request, callback) => {
        const url = request.url.substr(6);
        callback({ path: path.normalize(`${__dirname}/${url}`) });
    });

    artNet.on('message', (msg: ArtNetMessage) => {
        switch (msg.cmd) {
            case 'time':
                try {
                    win?.webContents.send('time', msg.clock);
                } catch (error) {
                    // Silent error
                }
                break;

            case 'rate':
                myEmitter.emit('rate', msg.rate);
                break;

            case 'state':
                myEmitter.emit('state', msg.state);
                break;

            case 'speed':
                myEmitter.emit('speed', msg.speed);
                break;

            case 'output':
                myEmitter.emit('output', msg.output);
                break;

            default:
                break;
        }
    });

    artNet.on('error', (err) => {
        console.log(err);
    });

    artNet.on('close', (err, msg) => {
        console.log('CLOSED', err, msg);
    });

    ipcMain.on('reactIsReady', () => {
        // console.log('React Is Ready')
        win?.webContents.send('message', 'React Is Ready');

        if (app.isPackaged) {
            win?.webContents.send('message', 'App is packaged');

            autoUpdater.on('error', (err) => win?.webContents.send('updater', err));
            autoUpdater.on('checking-for-update', () =>
                win?.webContents.send('updater', 'checking-for-update')
            );
            autoUpdater.on('update-available', (info) =>
                win?.webContents.send('updater', 'update-available', info)
            );
            autoUpdater.on('update-not-available', (info) =>
                win?.webContents.send('updater', 'update-not-available', info)
            );
            autoUpdater.on('download-progress', (info) =>
                win?.webContents.send('updater', 'download-progress', info)
            );
            autoUpdater.on('update-downloaded', (info) =>
                win?.webContents.send('updater', 'update-downloaded', info)
            );

            ipcMain.on('installUpdate', () => autoUpdater.quitAndInstall());

            setTimeout(() => autoUpdater.checkForUpdates(), 3000);
            setInterval(() => autoUpdater.checkForUpdates(), 1000 * 60 * 60);
        }
    });

    const setRate = async (rate: number): Promise<number> => {
        return new Promise((resolve) => {
            const handleRate = (newRate: number) => {
                myEmitter.removeListener('rate', handleRate);
                resolve(newRate);
            };

            myEmitter.on('rate', handleRate);
            artNet.send({ cmd: 'rate', rate });
        });
    };

    const setState = async (state: string): Promise<string> => {
        return new Promise((resolve) => {
            const handleState = (newState: string) => {
                myEmitter.removeListener('state', handleState);
                resolve(newState);
            };

            myEmitter.on('state', handleState);
            artNet.send({ cmd: 'state', state });
        });
    };

    const setSpeed = async (speed: number): Promise<number> => {
        return new Promise((resolve) => {
            const handleSpeed = (newSpeed: number) => {
                myEmitter.removeListener('speed', handleSpeed);
                resolve(newSpeed);
            };

            myEmitter.on('speed', handleSpeed);
            artNet.send({ cmd: 'speed', speed });
        });
    };

    const setConsoleAddress = async (address: string): Promise<any> => {
        return new Promise((resolve) => {
            const handleOutput = (newOut: any) => {
                myEmitter.removeListener('output', handleOutput);
                resolve(newOut);
            };

            myEmitter.on('output', handleOutput);
            artNet.send({ cmd: 'consoleAddress', address });
        });
    };

    ipcMain.handle('consoleAddress', async (_e: IpcMainInvokeEvent, address: string) => {
        return await setConsoleAddress(address);
    });

    ipcMain.handle('frameRate', async (_e: IpcMainInvokeEvent, rate: number) => {
        // console.log('Rate Set to', rate);
        return await setRate(rate);
    });

    ipcMain.handle('state', async (_e: IpcMainInvokeEvent, state: string) => {
        return await setState(state);
    });

    ipcMain.handle('speed', async (_e: IpcMainInvokeEvent, speed: number) => {
        return await setSpeed(speed);
    });

    ipcMain.on('time', (_e: IpcMainEvent, time: any) => {
        artNet.send({ cmd: 'time', time });
    });

    ipcMain.on('close', () => app.quit());
    ipcMain.on('min', () => win?.minimize());
    ipcMain.on('contentHeight', (_e: IpcMainEvent, height: number) => {
        win?.setSize(windowWidth, Math.ceil(height) + 2, false);
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => artNet.kill('SIGKILL'));

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
