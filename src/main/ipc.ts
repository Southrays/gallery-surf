import { ipcMain, dialog, shell, type BrowserWindow } from 'electron'
import { stat } from 'node:fs/promises'
import { extname } from 'node:path'
import type { AppSettings, CopyOrMoveRequest, ImageResult, Priority, RecentEntry } from '../shared/types'
import { scanFolder } from './scan'
import { getThumbnailPath, getPreviewPath } from './preview'
import { copyOrMove, cancelCopy } from './copyMove'
import { listRecents, addRecent, removeRecent } from './recents'
import { getSettings, updateSettings } from './settings'
import { loadSelections, saveSelections, type PhotoFlags } from './selections'
import { toCacheUrl } from './cacheProtocol'

export function registerIpcHandlers(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('pickFolder', async () => {
    const win = getWindow()
    const result = win
      ? await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
      : await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('scanFolder', async (_event, dirPath: string, recursive: boolean) => {
    return scanFolder(dirPath, recursive)
  })

  ipcMain.handle('getThumbnail', async (_event, path: string, priority: Priority = 'normal') => {
    const ext = extname(path).replace('.', '').toLowerCase()
    const s = await stat(path)
    const generated = await getThumbnailPath(path, ext, s.mtimeMs, s.size, priority)
    if (!generated) return null
    const result: ImageResult = { url: toCacheUrl('thumbs', generated.path), width: generated.width, height: generated.height }
    return result
  })

  ipcMain.handle('getPreview', async (_event, path: string, priority: Priority = 'normal') => {
    const ext = extname(path).replace('.', '').toLowerCase()
    const s = await stat(path)
    const generated = await getPreviewPath(path, ext, s.mtimeMs, s.size, priority)
    if (!generated) return null
    const result: ImageResult = { url: toCacheUrl('previews', generated.path), width: generated.width, height: generated.height }
    return result
  })

  ipcMain.handle('copyOrMove', async (_event, req: CopyOrMoveRequest) => {
    const win = getWindow()
    if (!win) return
    await copyOrMove(win, req)
  })

  ipcMain.handle('cancelCopy', async () => {
    cancelCopy()
  })

  ipcMain.handle('listRecents', async () => {
    return listRecents()
  })

  ipcMain.handle('addRecent', async (_event, entry: RecentEntry) => {
    await addRecent(entry)
  })

  ipcMain.handle('removeRecent', async (_event, path: string) => {
    await removeRecent(path)
  })

  ipcMain.handle('showItemInFolder', async (_event, path: string) => {
    shell.showItemInFolder(path)
  })

  ipcMain.handle('setFullScreen', async (_event, flag: boolean) => {
    getWindow()?.setFullScreen(flag)
  })

  ipcMain.handle('isFullScreen', async () => {
    return getWindow()?.isFullScreen() ?? false
  })

  ipcMain.handle('getSettings', async () => {
    return getSettings()
  })

  ipcMain.handle('updateSettings', async (_event, patch: Partial<AppSettings>) => {
    return updateSettings(patch)
  })

  ipcMain.handle('loadSelections', async (_event, folderPath: string) => {
    return loadSelections(folderPath)
  })

  ipcMain.handle('saveSelections', async (_event, folderPath: string, flags: Record<string, PhotoFlags>) => {
    await saveSelections(folderPath, flags)
  })
}
