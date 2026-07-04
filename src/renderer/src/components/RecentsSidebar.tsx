import { useState } from 'react'
import { useAppDispatch, useAppState } from '../state/AppContext'
import { FolderIcon, XIcon } from './icons'
import { useOpenFolder } from '../hooks/useOpenFolder'

export function RecentsSidebar(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const openFolder = useOpenFolder()
  const [openingPath, setOpeningPath] = useState<string | null>(null)

  async function handleOpen(path: string): Promise<void> {
    if (openingPath) return
    setOpeningPath(path)
    try {
      await openFolder(path)
    } finally {
      setOpeningPath(null)
    }
  }

  async function handleRemove(e: React.MouseEvent, path: string): Promise<void> {
    e.stopPropagation()
    await window.api.removeRecent(path)
    dispatch({ type: 'removeRecent', path })
  }

  return (
    <aside
      style={{
        width: 264,
        flex: 'none',
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '22px 0',
        overflow: 'auto'
      }}
    >
      <div
        style={{
          padding: '0 20px 12px',
          fontSize: 11,
          letterSpacing: '.09em',
          textTransform: 'uppercase',
          color: 'var(--muted-dim)',
          fontWeight: 600
        }}
      >
        Recent projects
      </div>
      {state.recents.length === 0 && (
        <div style={{ padding: '0 20px', fontSize: 12.5, color: 'var(--muted-dim)' }}>
          Folders you open will show up here.
        </div>
      )}
      {state.recents.map((r) => {
        const isOpening = openingPath === r.path
        return (
          <div
            key={r.path}
            onClick={() => handleOpen(r.path)}
            className="hover-row hover-overlay-parent"
            style={{
              position: 'relative',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '10px 20px',
              cursor: isOpening ? 'default' : 'pointer',
              borderLeft: '2px solid transparent',
              opacity: openingPath && !isOpening ? 0.5 : 1
            }}
          >
            <FolderIcon />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {r.name}
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted-dim)', marginTop: 2 }}>
                {isOpening ? (
                  'Opening…'
                ) : (
                  <>
                    {r.date} · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.count.toLocaleString()}</span>
                  </>
                )}
              </span>
            </span>
            {!isOpening && (
              <button
                onClick={(e) => handleRemove(e, r.path)}
                title="Remove from recent projects"
                className="hover-overlay-show hover-danger-circle"
                style={{
                  flex: 'none',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(15,17,21,.5)',
                  color: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <XIcon size={12} strokeWidth={2.4} />
              </button>
            )}
          </div>
        )
      })}
    </aside>
  )
}
