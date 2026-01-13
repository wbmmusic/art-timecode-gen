import { app, BrowserWindow, ipcMain, protocol, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import { fork, ChildProcess } from 'child_process';
import { autoUpdater } from 'electron-updater';
import { EventEmitter } from 'events';
import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';


// Declare Vite global variables
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

interface ArtNetMessage {
    cmd: 'time' | 'rate' | 'state' | 'speed' | 'output' | 'consoleAddress' | 'startTime';
    clock?: any;
    rate?: number;
    state?: string;
    speed?: number;
    output?: any;
    time?: any;
    address?: string;
    startTime?: number[];
}

interface AppConfig {
    consoleAddress: string;
    frameRate: number;
    speed: number;
    output: boolean;
    startTime: number[];
}

const myEmitter = new EventEmitter();
const windowWidth = 300;
let win: BrowserWindow | null = null;

const defaultConfig: AppConfig = {
    consoleAddress: '',
    frameRate: 30,
    speed: 1,
    output: false,
    startTime: [0, 0, 0, 0]
};

let configPath: string;
let currentConfig: AppConfig = { ...defaultConfig };

const loadConfig = (): AppConfig => {
    try {
        if (existsSync(configPath)) {
            console.log('[Config] Loading config from:', configPath);
            const data = readFileSync(configPath, 'utf8');
            const loaded = { ...defaultConfig, ...JSON.parse(data) };
            console.log('[Config] Loaded:', loaded);
            return loaded;
        } else {
            console.log('[Config] No config file found, using defaults');
        }
    } catch (error) {
        console.error('[Config] Failed to load config:', error);
    }
    console.log('[Config] Using default config:', defaultConfig);
    return { ...defaultConfig };
};

const saveConfig = (config: AppConfig): void => {
    try {
        console.log('[Config] Saving config:', config);
        writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        currentConfig = { ...config };
        console.log('[Config] Config saved successfully to:', configPath);
    } catch (error) {
        console.error('[Config] Failed to save config:', error);
    }
};



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

// Updated path for artNetTc.js in resources
const artNetPath = app.isPackaged
    ? join(process.resourcesPath, 'artNetTc.js')
    : join(__dirname, '..', '..', 'src', 'electron', 'artNetTc.js');

const artNet: ChildProcess = fork(artNetPath, { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
artNet.stdout?.pipe(process.stdout);
artNet.stderr?.pipe(process.stdout);

const createWindow = (): void => {
    // Create the browser window.
    win = new BrowserWindow({
        width: windowWidth,
        height: 298,
        autoHideMenuBar: true,
        show: false,
        title: 'ArtTimecode Gen v' + app.getVersion(),
        transparent: true,
        frame: false,
        resizable: false,
        hasShadow: false,
        icon: join(__dirname, 'icon.ico'),
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            sandbox: false,
        },
    });



    // In development, load from Vite dev server
    // In production, load from built files
    console.log('[DEBUG] MAIN_WINDOW_VITE_DEV_SERVER_URL:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
    console.log('[DEBUG] MAIN_WINDOW_VITE_NAME:', MAIN_WINDOW_VITE_NAME);
    console.log('[DEBUG] __dirname:', __dirname);
    console.log('[DEBUG] app.isPackaged:', app.isPackaged);

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        console.log('[DEBUG] Loading from dev server:', MAIN_WINDOW_VITE_DEV_SERVER_URL);
        win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        const rendererPath = join(__dirname, '../dist/index.html');
        console.log('[DEBUG] Loading from file:', rendererPath);
        win.loadFile(rendererPath);
    }

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('[DEBUG] Failed to load page:', errorCode, errorDescription, validatedURL);
    });

    // Emitted when the window is closed.
    win.on('closed', () => app.quit());
    win.on('ready-to-show', () => win?.show());

    // Open DevTools in development
    if (!app.isPackaged) {
        win.webContents.openDevTools({ mode: 'detach' });
    }
};

app.on('ready', () => {
    configPath = join(app.getPath('userData'), 'config.json');
    console.log('[Config] Config path:', configPath);
    currentConfig = loadConfig();

    // Initialize artNet with saved config
    console.log('[Config] Initializing artNet with saved config');
    artNet.send({ cmd: 'rate', rate: currentConfig.frameRate });
    console.log('[Config] Set frameRate:', currentConfig.frameRate);
    artNet.send({ cmd: 'speed', speed: currentConfig.speed });
    console.log('[Config] Set speed:', currentConfig.speed);
    artNet.send({ cmd: 'startTime', startTime: currentConfig.startTime });
    console.log('[Config] Set startTime:', currentConfig.startTime);
    if (currentConfig.output && currentConfig.consoleAddress) {
        artNet.send({ cmd: 'consoleAddress', address: currentConfig.consoleAddress });
        console.log('[Config] Set consoleAddress:', currentConfig.consoleAddress);
    }

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

        // Send initial config to renderer
        console.log('[Config] Sending config to renderer:', currentConfig);
        win?.webContents.send('config', currentConfig);

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
        console.log('[Config] consoleAddress changed to:', address);
        const result = await setConsoleAddress(address);
        currentConfig.consoleAddress = address;
        currentConfig.output = result;
        saveConfig(currentConfig);
        return result;
    });

    ipcMain.handle('frameRate', async (_e: IpcMainInvokeEvent, rate: number) => {
        console.log('[Config] frameRate changed to:', rate);
        const result = await setRate(rate);
        currentConfig.frameRate = result;
        saveConfig(currentConfig);
        return result;
    });

    ipcMain.handle('state', async (_e: IpcMainInvokeEvent, state: string) => {
        return await setState(state);
    });

    ipcMain.handle('speed', async (_e: IpcMainInvokeEvent, speed: number) => {
        console.log('[Config] speed changed to:', speed);
        const result = await setSpeed(speed);
        currentConfig.speed = result;
        saveConfig(currentConfig);
        return result;
    });

    ipcMain.handle('startTime', async (_e: IpcMainInvokeEvent, startTime: number[]) => {
        console.log('[Config] startTime changed to:', startTime);
        currentConfig.startTime = startTime;
        saveConfig(currentConfig);
        artNet.send({ cmd: 'startTime', startTime });
        return startTime;
    });

    ipcMain.on('time', (_e: IpcMainEvent, time: any) => {
        artNet.send({ cmd: 'time', time });
    });

    ipcMain.on('close', () => app.quit());
    ipcMain.on('min', () => win?.minimize());
    ipcMain.on('setClickThrough', (_e: IpcMainEvent, enabled: boolean) => {
        win?.setIgnoreMouseEvents(enabled, { forward: true });
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
