import { useEffect, useState } from 'react'
import { LogoIcon } from './icons'

const isMac = navigator.userAgent.includes('Mac')
// Keep in sync with titleBarOverlay.height in src/main/index.ts.
const FALLBACK_HEIGHT = 36

/** Windows/Linux report the exact rect Chromium reserves for the native
 *  caption buttons via the standard Window Controls Overlay API (the same
 *  one PWAs use) — reading it means our bar's height always matches what's
 *  actually rendered instead of both sides guessing at a fixed number. */
function useTitlebarHeight(): number {
  const [height, setHeight] = useState(FALLBACK_HEIGHT)

  useEffect(() => {
    const overlay = navigator.windowControlsOverlay
    if (!overlay) return

    const update = (): void => {
      const rect = overlay.getTitlebarAreaRect()
      if (rect.height > 0) setHeight(rect.height)
    }

    update()
    overlay.addEventListener('geometrychange', update)
    return () => overlay.removeEventListener('geometrychange', update)
  }, [])

  return height
}

/** Replaces the plain white OS title bar: native minimize/maximize/close
 *  controls still render (via titleBarOverlay on Windows/Linux, inset
 *  traffic lights on macOS), but the bar itself is colored to match the app
 *  and carries the logo + app name — the rest is empty draggable space. */
export function TitleBar(): React.JSX.Element {
  const height = useTitlebarHeight()

  return (
    <div className="titlebar" style={{ height, justifyContent: isMac ? 'center' : 'flex-start' }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none'
        }}
      >
        <LogoIcon size={13} />
      </div>
      <span style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-.01em' }}>Gallery Surf</span>
    </div>
  )
}
