import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const CLIENT_ID = '4570aec779ae4c7592bf16d5af30c3ad';
const REDIRECT_URI = 'http://localhost:5173/callback';
const SCOPES = 'user-read-currently-playing user-read-playback-state';

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: icon,
    width: 800,
    height: 540,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true
    }
  })
  mainWindow.on('ready-to-show', () => {
    mainWindow.webContents.setZoomFactor(0.63)
    mainWindow.show()
  })

  ipcMain.on('minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('maximize', () => {
    mainWindow.kiosk = !mainWindow.kiosk
  })

  ipcMain.on('login-spotify', () => {
    console.log('In the Backend')
    const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${encodeURIComponent(CLIENT_ID)}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&show_dialog=true`;
    mainWindow.loadURL(authUrl);
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the correct URL based on development or production
  if (is.dev) {
    // In development mode, load from Vite server
    mainWindow.loadURL('http://localhost:5173')
  } else {
    // In production mode, load from dist folder
    mainWindow.loadFile(join(__dirname, 'out/renderer/index.html')); 
  }

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (
      input.control &&
      (input.key === '+' || input.key === '-' || (input.shift && input.key === '+'))
    ) {
      event.preventDefault()
    }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
  

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
