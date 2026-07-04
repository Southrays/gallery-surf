import { useState } from 'react'
import { useAppDispatch, useAppState } from '../state/AppContext'
import { PhotoThumb } from '../components/PhotoThumb'
import { ChevronLeftIcon, XIcon } from '../components/icons'
import { fmtSize } from '../lib/format'

export function ReviewScreen(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const selected = state.photos.filter((p) => p.sel)
  const size = selected.reduce((a, p) => a + p.size, 0)

  function confirmClear(): void {
    dispatch({ type: 'clearAll' })
    setShowClearConfirm(false)
  }

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative' }}>
      <div
        style={{
          flex: 'none',
          position: 'relative',
          padding: '24px 32px 18px',
          borderBottom: '1px solid var(--border)',
          background: '#141721'
        }}
      >
        <button
          onClick={() => dispatch({ type: 'backToSelecting' })}
          className="hover-link"
          style={{
            background: 'transparent',
            color: 'var(--muted)',
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <ChevronLeftIcon />
          Back to selecting
        </button>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.01em' }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{selected.length.toLocaleString()}</span> photos selected
        </div>
        <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 5 }}>
          Review your picks before you copy or move them.
        </div>
        {selected.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="hover-link"
            style={{
              position: 'absolute',
              top: 24,
              right: 32,
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px 14px',
              borderRadius: 8
            }}
          >
            Clear selections
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '22px 32px 96px' }}>
        {selected.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))', gap: 14 }}>
            {selected.map((p) => {
              const realIndex = state.photos.findIndex((x) => x.id === p.id)
              return (
                <div
                  key={p.id}
                  className="hover-overlay-parent"
                  style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden', background: 'var(--card)' }}
                >
                  <PhotoThumb path={p.path} ext={p.ext} />
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,.45)'
                    }}
                  />
                  <div
                    className="hover-overlay-show"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-end',
                      padding: 8,
                      background: 'linear-gradient(to bottom, rgba(15,17,21,.55), transparent 42%)'
                    }}
                  >
                    <button
                      onClick={() => dispatch({ type: 'removeSel', index: realIndex })}
                      title="Remove from selection"
                      className="hover-danger-circle"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(15,17,21,.85)',
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <XIcon size={13} strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {selected.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted-dim)', padding: '80px 20px', fontSize: 15 }}>
            No photos selected yet.{' '}
            <button
              onClick={() => dispatch({ type: 'backToSelecting' })}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}
            >
              Go back to selecting →
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'rgba(25,28,34,.92)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border)'
        }}
      >
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>
          <span style={{ color: 'var(--text)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {selected.length.toLocaleString()}
          </span>{' '}
          photos <span style={{ color: 'var(--border)', margin: '0 3px' }}>·</span>{' '}
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtSize(size)}</span>
        </div>
        <button
          onClick={() => dispatch({ type: 'toCopyMove' })}
          disabled={selected.length === 0}
          className="hover-brighten"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            border: 'none',
            padding: '11px 22px',
            borderRadius: 10,
            fontSize: 14.5,
            fontWeight: 700,
            cursor: selected.length === 0 ? 'default' : 'pointer',
            opacity: selected.length === 0 ? 0.5 : 1
          }}
        >
          Copy or Move →
        </button>
      </div>

      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
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
              maxWidth: 400,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,.6)',
              padding: 26,
              animation: 'kpop .2s ease'
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Clear all selections?</div>
            <div style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.5, marginBottom: 22 }}>
              This removes the selected mark from all{' '}
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{selected.length.toLocaleString()}</span> photos.
              Rejected marks are left as they are. This can't be undone.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="hover-link"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '10px 6px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmClear}
                style={{
                  background: 'var(--reject)',
                  color: '#fff',
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Clear selections
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
