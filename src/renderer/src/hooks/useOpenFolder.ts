import { useCallback } from 'react'
import { useAppDispatch, useAppState } from '../state/AppContext'

function folderNameFromPath(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts[parts.length - 1] || path
}

/** Opens a folder (via native picker if no path given, or directly re-opening
 *  a recent one) and scans it for the Import screen's preview card. Restores
 *  any previously-saved selected/rejected flags for this folder so picks
 *  survive closing the app, sleep, restarts, etc. Does NOT touch the recents
 *  list — a folder only gets recorded there once the user actually commits
 *  to it by clicking "Start selecting". */
export function useOpenFolder(): (path?: string) => Promise<void> {
  const dispatch = useAppDispatch()
  const state = useAppState()

  return useCallback(
    async (path?: string) => {
      const dir = path ?? (await window.api.pickFolder())
      if (!dir) return

      const [photos, selections] = await Promise.all([
        window.api.scanFolder(dir, state.includeSubfolders),
        window.api.loadSelections(dir)
      ])
      const name = folderNameFromPath(dir)
      dispatch({ type: 'folderScanned', dir, name, photos, selections })
    },
    [dispatch, state.includeSubfolders]
  )
}
