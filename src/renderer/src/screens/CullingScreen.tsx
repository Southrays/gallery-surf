import { useEffect } from 'react'
import { useAppDispatch, useAppState } from '../state/AppContext'
import { ChevronLeftIcon, FolderIcon } from '../components/icons'
import { prefetchImage } from '../hooks/useImageUrl'
import { GridView } from './GridView'
import { LoupeView } from './LoupeView'

function segStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 15px',
    borderRadius: 7,
    border: 'none',
    background: active ? 'var(--card)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,.3)' : 'none'
  }
}

function zoomBtnStyle(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 7,
    border: 'none',
    background: active ? 'var(--card)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--muted)',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer'
  }
}

export function CullingScreen(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()

  const total = state.photos.length
  const selectedCount = state.photos.filter((p) => p.sel).length

  // Warm the whole folder's thumbnail + preview cache in the background at
  // low priority — interactive requests (the photo on screen, its neighbors)
  // always jump the queue, so this just fills in idle time and means most
  // navigation is a cache hit by the time you get there.
  useEffect(() => {
    for (const p of state.photos) {
      prefetchImage(p.path, 'thumb', 'normal')
    }
    for (const p of state.photos) {
      prefetchImage(p.path, 'preview', 'normal')
    }
  }, [state.photos])

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          height: 56,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 16px',
          background: 'var(--panel)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <button
          onClick={() => dispatch({ type: 'changeSource' })}
          title="Change source folder"
          className="hover-btn-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 8,
            padding: '6px 8px',
            cursor: 'pointer'
          }}
        >
          <ChevronLeftIcon />
          <FolderIcon size={16} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 190
            }}
          >
            {state.sourceName}
          </span>
        </button>

        <div
          style={{
            display: 'flex',
            gap: 2,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 9,
            padding: 3
          }}
        >
          <button onClick={() => dispatch({ type: 'setScreen', screen: 'grid' })} style={segStyle(state.screen === 'grid')}>
            Grid
          </button>
          <button onClick={() => dispatch({ type: 'setScreen', screen: 'loupe' })} style={segStyle(state.screen === 'loupe')}>
            Loupe
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
            Total <span style={{ color: 'var(--text)', fontWeight: 600 }}>{total.toLocaleString()}</span>{' '}
            <span style={{ color: 'var(--border)', margin: '0 4px' }}>·</span> Selected{' '}
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{selectedCount.toLocaleString()}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 9,
            padding: 3
          }}
        >
          <button onClick={() => dispatch({ type: 'setZoom', mode: 'fit', zoom: 1 })} style={zoomBtnStyle(state.zoomMode === 'fit')}>
            Fit
          </button>
          <button
            onClick={() => dispatch({ type: 'setZoom', mode: '100', zoom: 1.6 })}
            style={zoomBtnStyle(state.zoomMode === '100')}
          >
            100%
          </button>
          <button
            onClick={() => dispatch({ type: 'zoomOut' })}
            title="Zoom out"
            className="hover-btn-ghost"
            style={{
              padding: '6px 11px',
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 7,
              lineHeight: 1
            }}
          >
            −
          </button>
          <button
            onClick={() => dispatch({ type: 'zoomIn' })}
            title="Zoom in"
            className="hover-btn-ghost"
            style={{
              padding: '6px 11px',
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 7,
              lineHeight: 1
            }}
          >
            +
          </button>
        </div>

        <button
          onClick={() => dispatch({ type: 'toReview' })}
          className="hover-brighten"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            border: 'none',
            padding: '9px 16px',
            borderRadius: 9,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            flex: 'none'
          }}
        >
          Review selects →
        </button>
      </div>

      {state.screen === 'loupe' && <LoupeView />}
      {state.screen === 'grid' && <GridView />}
    </div>
  )
}
