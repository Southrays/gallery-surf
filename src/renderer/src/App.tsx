import { useEffect, useState } from 'react'
import { useAppDispatch, useAppState } from './state/AppContext'
import { ImportScreen } from './screens/ImportScreen'
import { CullingScreen } from './screens/CullingScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { CopyMoveModal } from './screens/CopyMoveModal'
import { ProgressDoneModal } from './screens/ProgressDoneModal'
import { TitleBar } from './components/TitleBar'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export function App(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()

  const [settingsHydrated, setSettingsHydrated] = useState(false)

  useKeyboardShortcuts()

  useEffect(() => {
    window.api.listRecents().then((recents) => dispatch({ type: 'setRecents', recents }))
    window.api.getSettings().then((settings) => {
      dispatch({ type: 'hydrateSettings', settings })
      setSettingsHydrated(true)
    })
  }, [dispatch])

  // Persist UI prefs (subfolder toggle, filmstrip height/collapsed) so they
  // survive closing the app — debounced since filmstripHeight changes
  // continuously while dragging the resize handle. Gated on settingsHydrated
  // so we don't clobber the just-loaded values with the reducer's defaults
  // before hydration has actually landed.
  useEffect(() => {
    if (!settingsHydrated) return
    const timer = setTimeout(() => {
      window.api.updateSettings({
        includeSubfolders: state.includeSubfolders,
        filmstripHeight: state.filmstripHeight,
        filmstripCollapsed: state.filmstripCollapsed
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [settingsHydrated, state.includeSubfolders, state.filmstripHeight, state.filmstripCollapsed])

  useEffect(() => {
    const offProgress = window.api.onCopyProgress((payload) => {
      dispatch({
        type: 'copyProgress',
        progress: {
          index: payload.index,
          total: payload.total,
          file: payload.file,
          bytesDone: payload.bytesDone,
          bytesTotal: payload.bytesTotal
        }
      })
    })
    const offDone = window.api.onCopyDone((info) => {
      dispatch({ type: 'copyDone', info })
    })
    return () => {
      offProgress()
      offDone()
    }
  }, [dispatch])

  // If fullscreen is left through an OS gesture (Esc, traffic-light button)
  // rather than our own toggle, drop out of the immersive Loupe view too.
  useEffect(() => {
    return window.api.onFullScreenChange((isFullScreen) => {
      if (!isFullScreen) dispatch({ type: 'setImmersive', value: false })
    })
  }, [dispatch])

  // Persist selected/rejected flags for the current folder on every change,
  // so picks survive closing the app, sleep, a restart, etc. Keyed by photo
  // id (path+mtime+size), not path, so a replaced file doesn't inherit a
  // stale pick. Only sel/rej photos are written — everything else defaults
  // to false anyway.
  useEffect(() => {
    if (!state.sourceDir) return
    const flags: Record<string, { sel: boolean; rej: boolean }> = {}
    for (const p of state.photos) {
      if (p.sel || p.rej) flags[p.id] = { sel: p.sel, rej: p.rej }
    }
    window.api.saveSelections(state.sourceDir, flags)
  }, [state.sourceDir, state.photos])

  return (
    <div className="app-shell">
      <TitleBar />
      <div className="app-root">
        {state.screen === 'import' && <ImportScreen />}
        {(state.screen === 'grid' || state.screen === 'loupe') && <CullingScreen />}
        {(state.screen === 'review' ||
          state.screen === 'copymove' ||
          state.screen === 'progress' ||
          state.screen === 'done') && <ReviewScreen />}
        {state.screen === 'copymove' && <CopyMoveModal />}
        {(state.screen === 'progress' || state.screen === 'done') && <ProgressDoneModal />}
      </div>
    </div>
  )
}
