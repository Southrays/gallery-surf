import { useAppDispatch, useAppState } from '../state/AppContext'
import { CopyIcon, MoveIcon, CheckIcon, FolderIcon } from '../components/icons'
import { fmtSize } from '../lib/format'
import type { CopyMode } from '../../../shared/types'

function choiceStyle(active: boolean): React.CSSProperties {
  return {
    textAlign: 'left',
    cursor: 'pointer',
    background: active ? 'rgba(232,163,61,0.09)' : 'var(--card)',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    transition: 'all .14s'
  }
}

export function CopyMoveModal(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()

  const selected = state.photos.filter((p) => p.sel)
  const size = selected.reduce((a, p) => a + p.size, 0)
  const subfolderTrimmed = state.subfolder.trim()
  const fullDest = state.dest ? (subfolderTrimmed ? `${state.dest}\\${subfolderTrimmed}` : state.dest) : '/Destination'

  async function chooseDest(): Promise<void> {
    const dir = await window.api.pickFolder()
    if (dir) dispatch({ type: 'setDest', dest: dir })
  }

  function startCopy(): void {
    if (!state.dest || selected.length === 0) return
    dispatch({ type: 'startCopy' })
    window.api.copyOrMove({
      files: selected.map((p) => p.path),
      destDir: state.dest,
      subfolder: subfolderTrimmed,
      mode: state.mode
    })
  }

  const setMode = (mode: CopyMode): void => dispatch({ type: 'setMode', mode })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        background: 'rgba(9,10,13,.78)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 544,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,.6)',
          padding: 26,
          animation: 'kpop .2s ease'
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.01em', marginBottom: 4 }}>
          Send {selected.length} selected photos
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 22 }}>
          Choose how to hand off your picks.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setMode('copy')} style={choiceStyle(state.mode === 'copy')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 24 }}>
              <CopyIcon />
              {state.mode === 'copy' && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckIcon size={12} color="var(--accent-ink)" strokeWidth={3.2} />
                </div>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 14, color: 'var(--text)' }}>Copy</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>
              Keep originals in the source folder
            </div>
          </button>
          <button onClick={() => setMode('move')} style={choiceStyle(state.mode === 'move')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 24 }}>
              <MoveIcon />
              {state.mode === 'move' && (
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CheckIcon size={12} color="var(--accent-ink)" strokeWidth={3.2} />
                </div>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 14, color: 'var(--text)' }}>Move</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.4 }}>
              Remove originals from the source folder
            </div>
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 7 }}>
            Destination folder
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                padding: '10px 12px',
                fontSize: 13,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <FolderIcon size={15} />
              {state.dest ? (
                <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {state.dest}
                </span>
              ) : (
                <span style={{ color: 'var(--muted-dim)' }}>No folder chosen</span>
              )}
            </div>
            <button
              onClick={chooseDest}
              className="hover-btn-ghost"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '10px 16px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                flex: 'none'
              }}
            >
              Choose…
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 7 }}>
            New subfolder name (optional)
          </label>
          <input
            value={state.subfolder}
            onChange={(e) => dispatch({ type: 'setSubfolder', subfolder: e.target.value })}
            placeholder="Selects"
            style={{
              width: '100%',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 9,
              padding: '10px 12px',
              fontSize: 13,
              color: 'var(--text)',
              outline: 'none'
            }}
          />
        </div>

        <div
          style={{
            background: '#141721',
            border: '1px solid var(--border)',
            borderRadius: 9,
            padding: '11px 13px',
            fontSize: 12.5,
            color: 'var(--muted)',
            marginBottom: 22,
            fontVariantNumeric: 'tabular-nums',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{selected.length}</span> photos ·{' '}
          {fmtSize(size)} <span style={{ color: 'var(--muted-dim)', margin: '0 4px' }}>→</span>{' '}
          <span style={{ color: 'var(--text)' }}>{fullDest}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
          <button
            onClick={() => dispatch({ type: 'cancelModal' })}
            className="hover-link"
            style={{ background: 'transparent', color: 'var(--muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '10px 6px' }}
          >
            Cancel
          </button>
          <button
            onClick={startCopy}
            disabled={!state.dest}
            className="hover-brighten"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: 'none',
              padding: '11px 22px',
              borderRadius: 10,
              fontSize: 14.5,
              fontWeight: 700,
              cursor: state.dest ? 'pointer' : 'default',
              opacity: state.dest ? 1 : 0.5
            }}
          >
            {state.mode === 'copy' ? 'Copy' : 'Move'} {selected.length} photos
          </button>
        </div>
      </div>
    </div>
  )
}
