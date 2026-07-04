import { contextBridge, ipcRenderer, webFrame } from 'electron'
import type {
  AppSettings,
  CopyDonePayload,
  CopyOrMoveRequest,
  CopyProgressPayload,
  GallerySurfApi,
  PhotoFlags,
  RecentEntry
} from '../shared/types'

const ZOOM_STEP = 0.1
const ZOOM_MIN = 0.5
const ZOOM_MAX = 2

function clampZoom(factor: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, factor))
}

const api: GallerySurfApi = {
  pickFolder: () => ipcRenderer.invoke('pickFolder'),
  scanFolder: (path, recursive) => ipcRenderer.invoke('scanFolder', path, recursive),
  getThumbnail: (path, priority) => ipcRenderer.invoke('getThumbnail', path, priority),
  getPreview: (path, priority) => ipcRenderer.invoke('getPreview', path, priority),
  copyOrMove: (req: CopyOrMoveRequest) => ipcRenderer.invoke('copyOrMove', req),
  cancelCopy: () => ipcRenderer.invoke('cancelCopy'),
  onCopyProgress: (cb: (payload: CopyProgressPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: CopyProgressPayload): void =>
      cb(payload)
    ipcRenderer.on('copy-progress', listener)
    return () => ipcRenderer.removeListener('copy-progress', listener)
  },
  onCopyDone: (cb: (payload: CopyDonePayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: CopyDonePayload): void => cb(payload)
    ipcRenderer.on('copy-done', listener)
    return () => ipcRenderer.removeListener('copy-done', listener)
  },
  listRecents: () => ipcRenderer.invoke('listRecents'),
  addRecent: (entry: RecentEntry) => ipcRenderer.invoke('addRecent', entry),
  removeRecent: (path: string) => ipcRenderer.invoke('removeRecent', path),
  showItemInFolder: (path: string) => ipcRenderer.invoke('showItemInFolder', path),
  setFullScreen: (flag: boolean) => ipcRenderer.invoke('setFullScreen', flag),
  isFullScreen: () => ipcRenderer.invoke('isFullScreen'),
  onFullScreenChange: (cb: (isFullScreen: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, value: boolean): void => cb(value)
    ipcRenderer.on('fullscreen-changed', listener)
    return () => ipcRenderer.removeListener('fullscreen-changed', listener)
  },
  uiZoomIn: () => {
    const next = clampZoom(webFrame.getZoomFactor() + ZOOM_STEP)
    webFrame.setZoomFactor(next)
    return next
  },
  uiZoomOut: () => {
    const next = clampZoom(webFrame.getZoomFactor() - ZOOM_STEP)
    webFrame.setZoomFactor(next)
    return next
  },
  uiZoomReset: () => {
    webFrame.setZoomFactor(1)
    return 1
  },
  getSettings: () => ipcRenderer.invoke('getSettings'),
  updateSettings: (patch: Partial<AppSettings>) => ipcRenderer.invoke('updateSettings', patch),
  loadSelections: (folderPath: string) => ipcRenderer.invoke('loadSelections', folderPath),
  saveSelections: (folderPath: string, flags: Record<string, PhotoFlags>) =>
    ipcRenderer.invoke('saveSelections', folderPath, flags)
}

contextBridge.exposeInMainWorld('api', api)
