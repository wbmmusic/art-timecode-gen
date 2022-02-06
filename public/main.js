const { app, BrowserWindow, ipcMain } = require('electron')
const { join } = require('path')
const { fork } = require('child_process')
const URL = require('url')
const { autoUpdater } = require('electron-updater');
const EventEmitter = require('events');
const myEmitter = new EventEmitter();

const windowWidth = 300
let win

// SECOND INSTANCE
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) app.quit()
else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) win.restore()
            win.focus()
        }
    })
}
// END SECOND INSTANCE


const artNet = fork(join(__dirname, 'artNetTc.js'), { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })
artNet.stdout.pipe(process.stdout)
artNet.stderr.pipe(process.stdout)

const createWindow = () => {
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
            preload: join(__dirname, 'preload.js')
        }
    })


    const startUrl = process.env.ELECTRON_START_URL || URL.format({
        pathname: join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
    });

    win.loadURL(startUrl);

    // Emitted when the window is closed.
    win.on('closed', () => app.quit())
    win.on('ready-to-show', () => win.show())
}

app.on('ready', () => {
    artNet.on('message', (msg) => {
        switch (msg.cmd) {
            case 'time':
                try {
                    win.webContents.send('time', msg.clock)
                } catch (error) {

                }
                break;

            case 'rate':
                myEmitter.emit('rate', msg.rate)
                break;

            case 'state':
                myEmitter.emit('state', msg.state)
                break;

            case 'speed':
                myEmitter.emit('speed', msg.speed)
                break;

            case 'output':
                myEmitter.emit('output', msg.output)
                break;

            default:
                break;
        }
    });
    artNet.on('error', (err) => { console.log(err); })
    artNet.on('close', (err, msg) => { console.log('CLOSED', err, msg); })

    ipcMain.on('reactIsReady', () => {
        //console.log('React Is Ready')
        win.webContents.send('message', 'React Is Ready')

        if (app.isPackaged) {
            win.webContents.send('message', 'App is packaged')

            autoUpdater.on('error', (err) => win.webContents.send('updater', err))
            autoUpdater.on('checking-for-update', () => win.webContents.send('updater', "checking-for-update"))
            autoUpdater.on('update-available', (info) => win.webContents.send('updater', 'update-available', info))
            autoUpdater.on('update-not-available', (info) => win.webContents.send('updater', 'update-not-available', info))
            autoUpdater.on('download-progress', (info) => win.webContents.send('updater', 'download-progress', info))
            autoUpdater.on('update-downloaded', (info) => win.webContents.send('updater', 'update-downloaded', info))

            ipcMain.on('installUpdate', () => autoUpdater.quitAndInstall())

            setTimeout(() => autoUpdater.checkForUpdates(), 3000);
            setInterval(() => autoUpdater.checkForUpdates(), 1000 * 60 * 60);
        }

    })

    const setRate = async(rate) => {
        return new Promise(async(resolve, reject) => {

            const handleRate = (newRate) => {
                myEmitter.removeListener('rate', handleRate)
                resolve(newRate)
            }

            myEmitter.on('rate', handleRate)


            artNet.send({ cmd: 'rate', rate })
        })
    }

    const setState = async(state) => {
        return new Promise(async(resolve, reject) => {

            const handleState = (newState) => {
                myEmitter.removeListener('state', handleState)
                resolve(newState)
            }

            myEmitter.on('state', handleState)


            artNet.send({ cmd: 'state', state })
        })
    }

    const setSpeed = async(speed) => {
        return new Promise(async(resolve, reject) => {

            const handleSpeed = (newSpeed) => {
                myEmitter.removeListener('speed', handleSpeed)
                resolve(newSpeed)
            }

            myEmitter.on('speed', handleSpeed)

            artNet.send({ cmd: 'speed', speed })
        })
    }

    const setConsoleAddress = async(address) => {
        return new Promise(async(resolve, reject) => {

            const handleOutput = (newOut) => {
                myEmitter.removeListener('output', handleOutput)
                resolve(newOut)
            }

            myEmitter.on('output', handleOutput)

            artNet.send({ cmd: 'consoleAddress', address })
        })
    }

    ipcMain.handle('consoleAddress', async(e, address) => {
        return await setConsoleAddress(address)
    })

    ipcMain.handle('frameRate', async(e, rate) => {
        //console.log('Rate Set to', rate);
        return await setRate(rate)
    })

    ipcMain.handle('state', async(e, state) => {
        return await setState(state)
    })

    ipcMain.handle('speed', async(e, speed) => {
        return await setSpeed(speed)
    })

    ipcMain.on('time', (e, time) => {
        artNet.send({ cmd: 'time', time })
    })

    ipcMain.on('close', () => app.quit())
    ipcMain.on('min', () => win.minimize())
    ipcMain.on('contentHeight', (e, height) => {
        win.setSize(windowWidth, Math.ceil(height) + 2, false)
    })

    createWindow()

    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('will-quit', () => artNet.kill('SIGKILL'))
    // Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})