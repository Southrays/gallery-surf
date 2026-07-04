import { useAppDispatch, useAppState } from '../state/AppContext'
import type { Filter } from '../state/types'
import { PhotoThumb } from '../components/PhotoThumb'
import { CheckIcon, XIcon, ExpandIcon } from '../components/icons'

function chipStyle(active: boolean): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '7px 13px',
    borderRadius: 8,
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    background: active ? 'rgba(232,163,61,0.12)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  }
}

export function GridView(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()

  const selected = state.photos.filter((p) => p.sel)
  const rejected = state.photos.filter((p) => p.rej)
  const unselected = state.photos.filter((p) => !p.sel && !p.rej)

  let filtered = state.photos
  if (state.filter === 'selected') filtered = selected
  else if (state.filter === 'unselected') filtered = unselected
  else if (state.filter === 'rejected') filtered = rejected

  const chip = (filter: Filter, label: string, count: number): React.JSX.Element => (
    <button onClick={() => dispatch({ type: 'setFilter', filter })} style={chipStyle(state.filter === filter)}>
      {label} <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>{count}</span>
    </button>
  )

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div
        style={{
          flex: 'none',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          background: '#141721'
        }}
      >
        {chip('all', 'All', state.photos.length)}
        {chip('selected', 'Selected', selected.length)}
        {chip('unselected', 'Unselected', unselected.length)}
        {chip('rejected', 'Rejected', rejected.length)}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => dispatch({ type: 'selectAll' })}
          className="hover-accent"
          style={{
            background: 'transparent',
            color: 'var(--muted)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 8px'
          }}
        >
          Select all
        </button>
        <span style={{ color: 'var(--border)' }}>/</span>
        <button
          onClick={() => dispatch({ type: 'clearAll' })}
          className="hover-link"
          style={{
            background: 'transparent',
            color: 'var(--muted)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 8px'
          }}
        >
          Clear
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(188px, 1fr))', gap: 12 }}>
          {filtered.map((p) => {
            const realIndex = state.photos.findIndex((x) => x.id === p.id)
            return (
              <div
                key={p.id}
                className="hover-overlay-parent"
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'var(--card)'
                }}
              >
                <PhotoThumb path={p.path} ext={p.ext} />
                {p.sel && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        border: '2px solid var(--accent)',
                        borderRadius: 10,
                        pointerEvents: 'none',
                        zIndex: 2
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 7,
                        right: 7,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 3px rgba(0,0,0,.45)',
                        zIndex: 3
                      }}
                    >
                      <CheckIcon size={12} color="var(--accent-ink)" strokeWidth={3.2} />
                    </div>
                  </>
                )}
                {p.rej && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15,17,21,.6)',
                        borderRadius: 10,
                        pointerEvents: 'none',
                        zIndex: 2
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: 'var(--reject)',
                        zIndex: 3,
                        boxShadow: '0 0 0 2px rgba(15,17,21,.5)'
                      }}
                    />
                  </>
                )}
                <div
                  onClick={() => dispatch({ type: 'toggleSel', index: realIndex })}
                  onDoubleClick={() => dispatch({ type: 'openLoupe', index: realIndex })}
                  className="hover-overlay-show"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 4,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: 9,
                    background: 'linear-gradient(to top, rgba(15,17,21,.9), rgba(15,17,21,0) 55%)'
                  }}
                >
                  <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dispatch({ type: 'toggleSel', index: realIndex })
                      }}
                      title="Select"
                      className="hover-select"
                      style={{
                        width: 29,
                        height: 29,
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(34,38,46,.92)',
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckIcon size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dispatch({ type: 'toggleRej', index: realIndex })
                      }}
                      title="Reject"
                      className="hover-reject"
                      style={{
                        width: 29,
                        height: 29,
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(34,38,46,.92)',
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <XIcon size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dispatch({ type: 'openLoupe', index: realIndex })
                      }}
                      title="Open in Loupe"
                      className="hover-neutral"
                      style={{
                        width: 29,
                        height: 29,
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(34,38,46,.92)',
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <ExpandIcon size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted-dim)', padding: '70px 20px', fontSize: 14 }}>
            No photos in this filter.
          </div>
        )}
      </div>
    </div>
  )
}
