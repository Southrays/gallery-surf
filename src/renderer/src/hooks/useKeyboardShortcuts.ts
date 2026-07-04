import { useEffect } from 'react'
import { useAppDispatch, useAppState } from '../state/AppContext'

export function useKeyboardShortcuts(): void {
  const state = useAppState()
  const dispatch = useAppDispatch()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      const inGallery = state.screen === 'grid' || state.screen === 'loupe'

      // Ctrl/Cmd +/- zooms the current photo while culling, and zooms the
      // app's own UI everywhere else (import/review/copy-move/progress).
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        if (inGallery) dispatch({ type: 'zoomIn' })
        else window.api.uiZoomIn()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault()
        if (inGallery) dispatch({ type: 'zoomOut' })
        else window.api.uiZoomOut()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        if (!inGallery) {
          e.preventDefault()
          window.api.uiZoomReset()
        }
        return
      }

      if (e.key === 'Escape' && state.immersive) {
        window.api.setFullScreen(false)
        dispatch({ type: 'setImmersive', value: false })
        return
      }

      if (!inGallery) return

      switch (e.key) {
        case 's':
        case 'S':
          dispatch({ type: 'toggleSel', index: state.current })
          break
        case 'r':
        case 'R':
          dispatch({ type: 'toggleRej', index: state.current })
          break
        case 'g':
        case 'G':
          dispatch({ type: 'setScreen', screen: 'grid' })
          break
        case 'e':
        case 'E':
          dispatch({ type: 'setScreen', screen: 'loupe' })
          break
        case 'f':
        case 'F':
          if (state.screen === 'loupe') {
            const next = !state.immersive
            window.api.setFullScreen(next)
            dispatch({ type: 'setImmersive', value: next })
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          dispatch({ type: 'go', delta: -1 })
          break
        case 'ArrowRight':
          e.preventDefault()
          dispatch({ type: 'go', delta: 1 })
          break
        case ' ':
          e.preventDefault()
          dispatch({ type: 'toggleZoom' })
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.screen, state.current, state.immersive, dispatch])
}
