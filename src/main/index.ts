import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { is } from './env'
import { ensureCacheDirs } from './paths'
import { registerCacheSchemeAsPrivileged, registerCacheProtocolHandler } from './cacheProtocol'
import { registerIpcHandlers } from './ipc'

registerCacheSchemeAsPrivileged()

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0F1115',
    autoHideMenuBar: true,
    // Only needed for unpackaged runs (electron-vite dev/preview) — a
    // packaged build already has this baked into the .exe itself by
    // electron-builder from build/icon.png, and `../../build/icon.png`
    // wouldn't resolve correctly from inside app.asar anyway.
    ...(app.isPackaged ? {} : { icon: join(__dirname, '../../build/icon.png') }),
    // Ditch the plain white OS title bar — keep the native minimize/
    // maximize/close controls (via titleBarOverlay on Windows/Linux, the
    // inset traffic lights on macOS) but color the bar to match the app and
    // let our own draggable strip render underneath it. `height` here is a
    // small deliberate bump above Windows' native caption height (a few px
    // taller) — safe to request now because the renderer reads back the
    // *actual* resulting rect via the standard `navigator.windowControlsOverlay`
    // API (see TitleBar.tsx) and sizes our bar to match it exactly, rather
    // than both sides independently guessing (which is what caused the
    // earlier mismatch).
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac
      ? {}
      : {
          titleBarOverlay: {
            // Must match .titlebar's `background` in styles.css exactly
            // (--panel, not --bg) or the native button strip visibly seams
            // against our own bar.
            color: '#191C22',
            symbolColor: '#9BA1AC',
            height: 36
          }
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Keep the renderer in sync if fullscreen is left through an OS gesture
  // (Esc, the green traffic-light button, F11) rather than our own toggle.
  mainWindow.on('enter-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-changed', true)
  })
  mainWindow.on('leave-full-screen', () => {
    mainWindow?.webContents.send('fullscreen-changed', false)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ensureCacheDirs()
  registerCacheProtocolHandler()
  registerIpcHandlers(() => mainWindow)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
