import { useAppDispatch, useAppState } from '../state/AppContext'
import { RecentsSidebar } from '../components/RecentsSidebar'
import { PhotoThumb } from '../components/PhotoThumb'
import { LogoIcon, FolderIcon, ChevronLeftIcon } from '../components/icons'
import { useOpenFolder } from '../hooks/useOpenFolder'
import { fmtSize } from '../lib/format'

export function ImportScreen(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()
  const openFolder = useOpenFolder()

  const folderChosen = state.sourceDir !== null
  const totalSize = state.photos.reduce((a, p) => a + p.size, 0)
  const stack = state.photos.slice(0, 4)

  async function handleToggleSubfolders(checked: boolean): Promise<void> {
    dispatch({ type: 'setIncludeSubfolders', value: checked })
    if (state.sourceDir) {
      const [photos, selections] = await Promise.all([
        window.api.scanFolder(state.sourceDir, checked),
        window.api.loadSelections(state.sourceDir)
      ])
      dispatch({ type: 'folderScanned', dir: state.sourceDir, name: state.sourceName, photos, selections })
    }
  }

  // Only record the folder in Recent Projects once the user actually commits
  // to it, not just for having opened/previewed it.
  async function handleStartSelecting(): Promise<void> {
    if (!state.sourceDir) return
    dispatch({ type: 'startSelecting' })
    await window.api.addRecent({
      path: state.sourceDir,
      name: state.sourceName,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: '2-digit' }),
      count: state.photos.length
    })
    const recents = await window.api.listRecents()
    dispatch({ type: 'setRecents', recents })
  }

  return (
    <>
      <RecentsSidebar />
      <main
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          overflow: 'auto'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 540,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 14 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LogoIcon size={21} />
            </div>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em' }}>Gallery Surf</span>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 20 }}>
            Surf the gallery, then copy or move your picks.
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 18,
              fontSize: 13,
              color: 'var(--muted)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              checked={state.includeSubfolders}
              onChange={(e) => handleToggleSubfolders(e.target.checked)}
              style={{ accentColor: '#E8A33D', width: 15, height: 15, cursor: 'pointer' }}
            />
            Include subfolders
          </label>

          {!folderChosen && (
            <div
              onClick={() => openFolder()}
              className="hover-card"
              style={{
                width: '100%',
                border: '2px dashed var(--border)',
                borderRadius: 12,
                background: 'var(--panel)',
                padding: '46px 32px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 18,
                cursor: 'pointer',
                transition: 'border-color .15s, background .15s'
              }}
            >
              <div
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: 15,
                  background: '#22262E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FolderIcon size={30} color="#9BA1AC" strokeWidth={1.6} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>
                  Choose a photo folder
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted-dim)' }}>
                  JPEG, PNG, HEIC, and RAW (CR3/ARW/NEF/…) are all supported
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openFolder()
                }}
                className="hover-btn-ghost"
                style={{
                  background: '#22262E',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '10px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Choose folder…
              </button>
            </div>
          )}

          {folderChosen && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                animation: 'kfade .28s ease'
              }}
            >
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 20,
                  textAlign: 'left'
                }}
              >
                <div style={{ position: 'relative', width: 128, height: 64, flex: 'none' }}>
                  {stack.map((p, i) => (
                    <div
                      key={p.id}
                      style={{
                        position: 'absolute',
                        top: (i % 2 ? 8 : 0) + 'px',
                        left: i * 26 + 'px',
                        width: 62,
                        height: 56,
                        borderRadius: 6,
                        border: '2px solid #22262E',
                        boxShadow: '0 2px 8px rgba(0,0,0,.45)',
                        zIndex: i,
                        overflow: 'hidden'
                      }}
                    >
                      <PhotoThumb path={p.path} ext={p.ext} />
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      color: 'var(--muted-dim)',
                      fontSize: 11,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      marginBottom: 7
                    }}
                  >
                    <FolderIcon size={13} strokeWidth={1.8} /> Source folder
                  </div>
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 600,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {state.sourceDir}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 5 }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text)', fontWeight: 600 }}>
                      {state.photos.length.toLocaleString()}
                    </span>{' '}
                    photos · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtSize(totalSize)}</span>
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'resetFolder' })}
                  className="hover-btn-ghost hover-link"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--muted)',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flex: 'none'
                  }}
                >
                  <ChevronLeftIcon size={14} color="currentColor" />
                  Change
                </button>
              </div>
              <button
                onClick={handleStartSelecting}
                disabled={state.photos.length === 0}
                className="hover-brighten"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  border: 'none',
                  padding: '13px 22px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: state.photos.length === 0 ? 'default' : 'pointer',
                  alignSelf: 'stretch',
                  opacity: state.photos.length === 0 ? 0.5 : 1,
                  transition: 'filter .15s'
                }}
              >
                {state.photos.length === 0 ? 'No supported photos found' : 'Start selecting →'}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
