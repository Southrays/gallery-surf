import type { Action, AppState } from './types'

export const initialState: AppState = {
  screen: 'import',
  sourceDir: null,
  sourceName: '',
  photos: [],
  current: 0,
  filter: 'all',
  zoomMode: 'fit',
  zoom: 1,
  mode: 'copy',
  dest: '',
  subfolder: '',
  progress: null,
  doneInfo: null,
  recents: [],
  includeSubfolders: false,
  filmstripHeight: 98,
  filmstripCollapsed: false,
  immersive: false
}

function clampCurrent(index: number, length: number): number {
  if (length === 0) return 0
  return Math.max(0, Math.min(length - 1, index))
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setRecents':
      return { ...state, recents: action.recents }

    case 'folderScanned':
      return {
        ...state,
        sourceDir: action.dir,
        sourceName: action.name,
        photos: action.photos.map((p) => {
          const flags = action.selections?.[p.id]
          return { ...p, sel: flags?.sel ?? false, rej: flags?.rej ?? false }
        }),
        current: 0
      }

    case 'resetFolder':
      return { ...state, sourceDir: null, sourceName: '', photos: [] }

    case 'startSelecting':
      return { ...state, screen: 'loupe', current: 0 }

    case 'changeSource':
      return { ...state, screen: 'import', sourceDir: null, sourceName: '', photos: [], immersive: false }

    case 'setScreen':
      return { ...state, screen: action.screen, immersive: action.screen === 'grid' ? false : state.immersive }

    case 'setCurrent':
      return { ...state, current: clampCurrent(action.index, state.photos.length) }

    case 'openLoupe':
      return { ...state, current: clampCurrent(action.index, state.photos.length), screen: 'loupe' }

    case 'go':
      return { ...state, current: clampCurrent(state.current + action.delta, state.photos.length) }

    case 'toggleSel': {
      const photos = state.photos.slice()
      const p = { ...photos[action.index] }
      p.sel = !p.sel
      if (p.sel) p.rej = false
      photos[action.index] = p
      return { ...state, photos }
    }

    case 'toggleRej': {
      const photos = state.photos.slice()
      const p = { ...photos[action.index] }
      p.rej = !p.rej
      if (p.rej) p.sel = false
      photos[action.index] = p
      return { ...state, photos }
    }

    case 'removeSel': {
      const photos = state.photos.slice()
      photos[action.index] = { ...photos[action.index], sel: false }
      return { ...state, photos }
    }

    case 'selectAll':
      return { ...state, photos: state.photos.map((p) => ({ ...p, sel: true, rej: false })) }

    case 'clearAll':
      return { ...state, photos: state.photos.map((p) => ({ ...p, sel: false })) }

    case 'setFilter':
      return { ...state, filter: action.filter }

    case 'setZoom':
      return { ...state, zoomMode: action.mode, zoom: action.zoom }

    case 'zoomIn':
      return {
        ...state,
        zoomMode: '100',
        zoom: Math.min(4, (state.zoomMode === 'fit' ? 1 : state.zoom) + 0.4)
      }

    case 'zoomOut': {
      if (state.zoomMode === 'fit') return state
      const next = state.zoom - 0.4
      return next <= 1 ? { ...state, zoomMode: 'fit', zoom: 1 } : { ...state, zoomMode: '100', zoom: next }
    }

    case 'toggleZoom':
      return {
        ...state,
        zoomMode: state.zoomMode === 'fit' ? '100' : 'fit',
        zoom: state.zoomMode === 'fit' ? 1.6 : 1
      }

    case 'toReview':
      return { ...state, screen: 'review', immersive: false }

    case 'backToSelecting':
      return { ...state, screen: 'loupe' }

    case 'toCopyMove':
      return { ...state, screen: 'copymove' }

    case 'cancelModal':
      return { ...state, screen: 'review' }

    case 'setMode':
      return { ...state, mode: action.mode }

    case 'setDest':
      return { ...state, dest: action.dest }

    case 'setSubfolder':
      return { ...state, subfolder: action.subfolder }

    case 'startCopy':
      return { ...state, screen: 'progress', progress: null, doneInfo: null }

    case 'copyProgress':
      return { ...state, progress: action.progress }

    case 'copyDone':
      return { ...state, screen: 'done', doneInfo: action.info }

    case 'cancelCopy':
      return { ...state, screen: 'review', progress: null }

    case 'startNew':
      return {
        ...initialState,
        recents: state.recents,
        includeSubfolders: state.includeSubfolders,
        filmstripHeight: state.filmstripHeight,
        filmstripCollapsed: state.filmstripCollapsed
      }

    case 'setIncludeSubfolders':
      return { ...state, includeSubfolders: action.value }

    case 'setFilmstripHeight':
      return { ...state, filmstripHeight: Math.max(64, Math.min(240, action.height)) }

    case 'toggleFilmstripCollapsed':
      return { ...state, filmstripCollapsed: !state.filmstripCollapsed }

    case 'removeRecent':
      return { ...state, recents: state.recents.filter((r) => r.path !== action.path) }

    case 'setImmersive':
      return { ...state, immersive: action.value }

    case 'hydrateSettings':
      return {
        ...state,
        includeSubfolders: action.settings.includeSubfolders,
        filmstripHeight: Math.max(64, Math.min(240, action.settings.filmstripHeight)),
        filmstripCollapsed: action.settings.filmstripCollapsed
      }

    default:
      return state
  }
}
