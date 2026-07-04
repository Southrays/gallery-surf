import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppState } from '../state/AppContext'
import { useLazyImage, prefetchImage } from '../hooks/useImageUrl'
import type { AppPhoto } from '../state/types'
import { ArrowsInIcon, ArrowsOutIcon, CheckIcon, ChevronIcon, XIcon } from '../components/icons'

const AHEAD_RADIUS = 6
const BEHIND_RADIUS = 2
const DEFAULT_ASPECT = 4 / 3
const FILM_PADDING_Y = 12 * 2
const COLLAPSED_HEIGHT = 22

function actionBtnStyle(active: boolean, activeBg: string, activeColor: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 20px',
    borderRadius: 9,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all .14s',
    background: active ? activeBg : 'transparent',
    color: active ? activeColor : 'var(--text)',
    border: '1px solid ' + (active ? activeBg : 'var(--border)')
  }
}

function HintKey({ children, color = '#9BA1AC' }: { children: React.ReactNode; color?: string }): React.JSX.Element {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 17,
        height: 17,
        padding: '0 4px',
        border: '1px solid var(--border)',
        borderRadius: 4,
        background: 'var(--bg)',
        color,
        fontSize: 10,
        fontWeight: 700
      }}
    >
      {children}
    </span>
  )
}

function Hint({ keyLabel, label, color }: { keyLabel: React.ReactNode; label: string; color?: string }): React.JSX.Element {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <HintKey color={color}>{keyLabel}</HintKey>
      {label}
    </span>
  )
}

function FilmstripItem({
  photo,
  index,
  itemHeight,
  isCurrent,
  onClick
}: {
  photo: AppPhoto
  index: number
  itemHeight: number
  isCurrent: boolean
  onClick: () => void
}): React.JSX.Element {
  const { ref, status, url, width, height } = useLazyImage(photo.path, 'thumb', { priority: 'normal' })
  const aspect = width && height ? width / height : DEFAULT_ASPECT
  const itemWidth = Math.max(36, Math.round(itemHeight * aspect))

  return (
    <div
      ref={ref}
      data-film-index={index}
      onClick={onClick}
      style={{
        position: 'relative',
        height: itemHeight,
        width: itemWidth,
        flex: 'none',
        borderRadius: 7,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'var(--card)'
      }}
    >
      {status === 'ready' && url && (
        <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
      {status === 'loading' && <div className="thumb-shimmer" style={{ width: '100%', height: '100%' }} />}
      {status === 'error' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted-dim)',
            fontSize: 10,
            fontWeight: 700
          }}
        >
          {photo.ext.toUpperCase()}
        </div>
      )}
      {isCurrent && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px solid var(--accent)',
            borderRadius: 7,
            boxShadow: '0 0 0 3px rgba(232,163,61,.22)',
            pointerEvents: 'none'
          }}
        />
      )}
      {photo.sel && (
        <div
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,.45)'
          }}
        >
          <CheckIcon size={11} color="var(--accent-ink)" strokeWidth={3.4} />
        </div>
      )}
      {photo.rej && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,17,21,.6)', pointerEvents: 'none' }} />
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--reject)',
              boxShadow: '0 0 0 2px rgba(15,17,21,.5)'
            }}
          />
        </>
      )}
    </div>
  )
}

export function LoupeView(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const filmRef = useRef<HTMLDivElement | null>(null)

  const current = state.photos[state.current] ?? null

  // Blur-up: the small thumbnail is almost always already cached (grid,
  // filmstrip, or the background warm pass) and decodes instantly, so show
  // it right away and swap to the full preview the moment it's ready instead
  // of staring at a blank/loading state.
  const {
    status: thumbStatus,
    url: thumbUrl,
    width: thumbW,
    height: thumbH
  } = useLazyImage(current ? current.path : '', 'thumb', { lazy: false, priority: 'urgent' })
  const {
    status: previewStatus,
    url: previewUrl,
    width: previewW,
    height: previewH
  } = useLazyImage(current ? current.path : '', 'preview', { lazy: false, priority: 'urgent' })

  const displayUrl = previewStatus === 'ready' ? previewUrl : thumbStatus === 'ready' ? thumbUrl : null
  const isPlaceholder = previewStatus !== 'ready' && thumbStatus === 'ready'
  const stillLoading = !displayUrl && (previewStatus === 'loading' || thumbStatus === 'loading')
  const bothFailed = previewStatus === 'error' && thumbStatus === 'error'
  const selectedCount = state.photos.filter((p) => p.sel).length

  // The thumbnail and full preview share the same source photo, so its aspect
  // ratio is already known from whichever finished first — pin the display
  // box to it (via CSS aspect-ratio) so the low-res placeholder renders at
  // the same apparent size as the eventual full preview, not shrunk down to
  // its own small native pixel size ("zoomed out").
  const knownAspect =
    previewStatus === 'ready' && previewW && previewH
      ? `${previewW} / ${previewH}`
      : thumbStatus === 'ready' && thumbW && thumbH
        ? `${thumbW} / ${thumbH}`
        : '3 / 2'

  function enterImmersive(): void {
    window.api.setFullScreen(true)
    dispatch({ type: 'setImmersive', value: true })
  }
  function exitImmersive(): void {
    window.api.setFullScreen(false)
    dispatch({ type: 'setImmersive', value: false })
  }

  // Warm the cache for neighboring photos so left/right navigation feels
  // instant instead of waiting on a fresh decode each time — prefetch further
  // ahead in whichever direction the user is actually moving.
  const lastCurrentRef = useRef(state.current)
  useEffect(() => {
    const prev = lastCurrentRef.current
    const dir = state.current >= prev ? 1 : -1
    lastCurrentRef.current = state.current

    for (let d = 1; d <= AHEAD_RADIUS; d++) {
      const ahead = state.photos[state.current + d * dir]
      if (ahead) prefetchImage(ahead.path, 'preview', 'high')
    }
    for (let d = 1; d <= BEHIND_RADIUS; d++) {
      const behind = state.photos[state.current - d * dir]
      if (behind) prefetchImage(behind.path, 'preview', 'high')
    }
  }, [state.current, state.photos])

  useEffect(() => {
    if (state.filmstripCollapsed) return
    const el = filmRef.current
    if (!el) return
    const child = el.querySelector<HTMLElement>(`[data-film-index="${state.current}"]`)
    if (child) {
      el.scrollTo({
        left: child.offsetLeft - el.clientWidth / 2 + child.clientWidth / 2,
        behavior: 'smooth'
      })
    }
  }, [state.current, state.filmstripCollapsed])

  function startResize(e: React.MouseEvent): void {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = state.filmstripHeight
    const onMove = (ev: MouseEvent): void => {
      dispatch({ type: 'setFilmstripHeight', height: startHeight + (startY - ev.clientY) })
    }
    const onUp = (): void => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const filmItemHeight = state.filmstripHeight - FILM_PADDING_Y

  if (state.immersive) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {current && displayUrl && (
          <img
            src={displayUrl}
            onClick={() => dispatch({ type: 'toggleZoom' })}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: state.zoomMode === 'fit' ? 'none' : `scale(${state.zoom})`,
              transition: 'transform .18s ease, filter .15s ease',
              filter: isPlaceholder ? 'blur(6px) brightness(0.92)' : 'none',
              cursor: state.zoomMode === 'fit' ? 'zoom-in' : 'zoom-out'
            }}
          />
        )}
        {current && stillLoading && (
          <div style={{ color: 'var(--muted-dim)', fontSize: 14 }}>Loading preview…</div>
        )}
        {current && bothFailed && (
          <div style={{ color: 'var(--muted-dim)', fontSize: 14 }}>No preview available for this file</div>
        )}

        <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          {current?.sel && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(232,163,61,.16)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                fontSize: 12.5,
                fontWeight: 700
              }}
            >
              <CheckIcon size={13} strokeWidth={3} />
              Selected
            </div>
          )}
          {current?.rej && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(229,72,77,.16)',
                border: '1px solid var(--reject)',
                color: 'var(--reject)',
                fontSize: 12.5,
                fontWeight: 700
              }}
            >
              <XIcon size={12} strokeWidth={3} />
              Rejected
            </div>
          )}
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(15,17,21,.6)',
              border: '1px solid rgba(255,255,255,.14)',
              color: 'var(--text)',
              fontSize: 12.5,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {selectedCount.toLocaleString()} selected
          </div>
        </div>

        <button
          onClick={exitImmersive}
          title="Exit full screen (Esc)"
          className="hover-btn-ghost"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: 34,
            height: 34,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,.14)',
            background: 'rgba(15,17,21,.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ArrowsInIcon size={15} />
        </button>

        <div
          style={{
            position: 'absolute',
            left: 18,
            bottom: 18,
            fontSize: 12.5,
            color: 'var(--text)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            background: 'rgba(15,17,21,.6)',
            border: '1px solid rgba(255,255,255,.14)',
            padding: '6px 12px',
            borderRadius: 20
          }}
        >
          {current ? state.current + 1 : 0} / {state.photos.length}
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 26,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {current && displayUrl && (
            <div
              onClick={() => dispatch({ type: 'toggleZoom' })}
              style={{
                position: 'relative',
                maxWidth: '100%',
                maxHeight: '100%',
                aspectRatio: knownAspect,
                borderRadius: 3,
                boxShadow: '0 10px 44px rgba(0,0,0,.55)',
                overflow: 'hidden',
                transform: state.zoomMode === 'fit' ? 'none' : `scale(${state.zoom})`,
                transition: 'transform .18s ease',
                cursor: state.zoomMode === 'fit' ? 'zoom-in' : 'zoom-out'
              }}
            >
              {/* Sized to the known aspect ratio (from whichever of
                  thumb/preview is ready) rather than the image's own natural
                  pixels, so the low-res blur-up placeholder fills the same
                  box as the eventual full preview instead of rendering at
                  its own tiny native size. */}
              <img
                src={displayUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'contain',
                  transition: 'filter .15s ease',
                  filter: isPlaceholder ? 'blur(6px) brightness(0.92)' : 'none'
                }}
              />
            </div>
          )}
          {current && stillLoading && (
            <div style={{ color: 'var(--muted-dim)', fontSize: 14 }}>Loading preview…</div>
          )}
          {current && bothFailed && (
            <div style={{ color: 'var(--muted-dim)', fontSize: 14 }}>No preview available for this file</div>
          )}
          <div
            style={{
              position: 'absolute',
              left: 22,
              bottom: 16,
              fontSize: 11.5,
              color: 'var(--muted)',
              fontVariantNumeric: 'tabular-nums',
              background: 'rgba(15,17,21,.62)',
              padding: '4px 9px',
              borderRadius: 6
            }}
          >
            {current ? state.current + 1 : 0} / {state.photos.length}
          </div>
          <button
            onClick={enterImmersive}
            title="Full screen (F)"
            className="hover-btn-ghost"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'rgba(15,17,21,.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ArrowsOutIcon size={14} color="#9BA1AC" />
          </button>
        </div>

        <div
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '4px 0 14px'
          }}
        >
          <button
            onClick={() => current && dispatch({ type: 'toggleSel', index: state.current })}
            style={actionBtnStyle(!!current?.sel, 'var(--accent)', 'var(--accent-ink)')}
          >
            <CheckIcon size={16} strokeWidth={2.4} />
            Select
          </button>
          <button
            onClick={() => current && dispatch({ type: 'toggleRej', index: state.current })}
            style={actionBtnStyle(!!current?.rej, 'var(--reject)', '#FFFFFF')}
          >
            <XIcon size={16} strokeWidth={2.2} />
            Reject
          </button>
        </div>

        <div
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '8px 0',
            borderTop: '1px solid var(--border)',
            background: '#141721',
            fontSize: 11.5,
            color: 'var(--muted-dim)'
          }}
        >
          <Hint keyLabel="G" label="Grid" />
          <Hint keyLabel="E" label="Loupe" />
          <Hint keyLabel="F" label="Full screen" />
          <Hint keyLabel="Space" label="Zoom" />
          <Hint keyLabel="←→" label="Navigate" />
          <Hint keyLabel="S" label="Select" color="var(--accent)" />
          <Hint keyLabel="R" label="Reject" color="var(--reject)" />
        </div>

        {/* Outer wrapper is NOT clipped, so the resize handle and collapse
            toggle (which sit partly outside the scroll strip's own box) stay
            fully visible and grabbable — the inner strip below is the only
            part with overflow:hidden/auto. */}
        <div style={{ position: 'relative', flex: 'none' }}>
          {!state.filmstripCollapsed && (
            <div
              onMouseDown={startResize}
              title="Drag to resize"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: -4,
                height: 9,
                cursor: 'row-resize',
                zIndex: 5
              }}
            />
          )}
          <button
            onClick={() => dispatch({ type: 'toggleFilmstripCollapsed' })}
            title={state.filmstripCollapsed ? 'Expand filmstrip' : 'Collapse filmstrip'}
            className="hover-btn-ghost"
            style={{
              position: 'absolute',
              right: 24,
              top: -11,
              zIndex: 6,
              width: 34,
              height: 18,
              borderRadius: 5,
              border: '1px solid ' + (current?.sel ? 'var(--accent)' : current?.rej ? 'var(--reject)' : 'var(--border)'),
              background: 'var(--card)',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ChevronIcon size={12} direction={state.filmstripCollapsed ? 'up' : 'down'} />
          </button>
          <div
            ref={filmRef}
            style={{
              height: state.filmstripCollapsed ? COLLAPSED_HEIGHT : state.filmstripHeight,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: state.filmstripCollapsed ? 0 : '12px 14px',
              background: 'var(--panel)',
              borderTop: '1px solid var(--border)',
              overflowX: state.filmstripCollapsed ? 'hidden' : 'auto',
              overflowY: 'hidden',
              transition: 'height .15s ease'
            }}
          >
            {!state.filmstripCollapsed &&
              state.photos.map((p, i) => (
                <FilmstripItem
                  key={p.id}
                  photo={p}
                  index={i}
                  itemHeight={filmItemHeight}
                  isCurrent={i === state.current}
                  onClick={() => dispatch({ type: 'setCurrent', index: i })}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
