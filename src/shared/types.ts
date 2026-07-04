export interface PhotoMeta {
  id: string
  path: string
  name: string
  ext: string
  size: number
  mtimeMs: number
}

export interface RecentEntry {
  path: string
  name: string
  date: string
  count: number
}

export type CopyMode = 'copy' | 'move'

export interface CopyOrMoveRequest {
  files: string[]
  destDir: string
  subfolder: string
  mode: CopyMode
}

export interface CopyProgressPayload {
  index: number
  total: number
  file: string
  bytesDone: number
  bytesTotal: number
}

export interface CopyDonePayload {
  total: number
  succeeded: number
  failed: Array<{ file: string; error: string }>
  cancelled: boolean
  destDir: string
  mode: CopyMode
}

export const SUPPORTED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'heic',
  'heif',
  'cr3',
  'cr2',
  'nef',
  'arw',
  'dng',
  'raf',
  'rw2',
  'orf'
]

export const RAW_LIKE_EXTENSIONS = new Set([
  'heic',
  'heif',
  'cr3',
  'cr2',
  'nef',
  'arw',
  'dng',
  'raf',
  'rw2',
  'orf'
])

// 'urgent' = the photo on screen right now, 'high' = neighbors we're
// speculatively prefetching for smooth navigation, 'normal' = whole-folder
// background warm pass. Keeping the on-screen photo in its own top tier means
// a burst of fast navigation (which queues many 'high' neighbor prefetches)
// can never make the actual current photo wait behind stale prefetch work.
export type Priority = 'urgent' | 'high' | 'normal'

export interface ImageResult {
  url: string
  width: number
  height: number
}

export interface PhotoFlags {
  sel: boolean
  rej: boolean
}

export interface AppSettings {
  includeSubfolders: boolean
  filmstripHeight: number
  filmstripCollapsed: boolean
}

export interface GallerySurfApi {
  pickFolder(): Promise<string | null>
  scanFolder(path: string, recursive: boolean): Promise<PhotoMeta[]>
  getThumbnail(path: string, priority?: Priority): Promise<ImageResult | null>
  getPreview(path: string, priority?: Priority): Promise<ImageResult | null>
  copyOrMove(req: CopyOrMoveRequest): Promise<void>
  cancelCopy(): Promise<void>
  onCopyProgress(cb: (payload: CopyProgressPayload) => void): () => void
  onCopyDone(cb: (payload: CopyDonePayload) => void): () => void
  listRecents(): Promise<RecentEntry[]>
  addRecent(entry: RecentEntry): Promise<void>
  removeRecent(path: string): Promise<void>
  showItemInFolder(path: string): Promise<void>
  setFullScreen(flag: boolean): Promise<void>
  isFullScreen(): Promise<boolean>
  onFullScreenChange(cb: (isFullScreen: boolean) => void): () => void
  uiZoomIn(): number
  uiZoomOut(): number
  uiZoomReset(): number
  getSettings(): Promise<AppSettings>
  updateSettings(patch: Partial<AppSettings>): Promise<AppSettings>
  loadSelections(folderPath: string): Promise<Record<string, PhotoFlags>>
  saveSelections(folderPath: string, flags: Record<string, PhotoFlags>): Promise<void>
}
