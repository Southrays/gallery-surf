import type { AppSettings, CopyDonePayload, CopyMode, PhotoFlags, PhotoMeta, RecentEntry } from '../../../shared/types'

export type Screen = 'import' | 'grid' | 'loupe' | 'review' | 'copymove' | 'progress' | 'done'
export type Filter = 'all' | 'selected' | 'unselected' | 'rejected'
export type ZoomMode = 'fit' | '100'

export interface AppPhoto extends PhotoMeta {
  sel: boolean
  rej: boolean
}

export interface ProgressState {
  index: number
  total: number
  file: string
  bytesDone: number
  bytesTotal: number
}

export interface AppState {
  screen: Screen
  sourceDir: string | null
  sourceName: string
  photos: AppPhoto[]
  current: number
  filter: Filter
  zoomMode: ZoomMode
  zoom: number
  mode: CopyMode
  dest: string
  subfolder: string
  progress: ProgressState | null
  doneInfo: CopyDonePayload | null
  recents: RecentEntry[]
  includeSubfolders: boolean
  filmstripHeight: number
  filmstripCollapsed: boolean
  immersive: boolean
}

export type Action =
  | { type: 'setRecents'; recents: RecentEntry[] }
  | { type: 'folderScanned'; dir: string; name: string; photos: PhotoMeta[]; selections?: Record<string, PhotoFlags> }
  | { type: 'resetFolder' }
  | { type: 'startSelecting' }
  | { type: 'changeSource' }
  | { type: 'setScreen'; screen: 'grid' | 'loupe' }
  | { type: 'setCurrent'; index: number }
  | { type: 'openLoupe'; index: number }
  | { type: 'go'; delta: number }
  | { type: 'toggleSel'; index: number }
  | { type: 'toggleRej'; index: number }
  | { type: 'removeSel'; index: number }
  | { type: 'selectAll' }
  | { type: 'clearAll' }
  | { type: 'setFilter'; filter: Filter }
  | { type: 'setZoom'; mode: ZoomMode; zoom: number }
  | { type: 'zoomIn' }
  | { type: 'zoomOut' }
  | { type: 'toggleZoom' }
  | { type: 'toReview' }
  | { type: 'backToSelecting' }
  | { type: 'toCopyMove' }
  | { type: 'cancelModal' }
  | { type: 'setMode'; mode: CopyMode }
  | { type: 'setDest'; dest: string }
  | { type: 'setSubfolder'; subfolder: string }
  | { type: 'startCopy' }
  | { type: 'copyProgress'; progress: ProgressState }
  | { type: 'copyDone'; info: CopyDonePayload }
  | { type: 'cancelCopy' }
  | { type: 'startNew' }
  | { type: 'setIncludeSubfolders'; value: boolean }
  | { type: 'setFilmstripHeight'; height: number }
  | { type: 'toggleFilmstripCollapsed' }
  | { type: 'removeRecent'; path: string }
  | { type: 'setImmersive'; value: boolean }
  | { type: 'hydrateSettings'; settings: AppSettings }
