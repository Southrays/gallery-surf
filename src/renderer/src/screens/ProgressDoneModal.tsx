import { useAppDispatch, useAppState } from '../state/AppContext'
import { CheckIcon, CopyIcon } from '../components/icons'

export function ProgressDoneModal(): React.JSX.Element {
  const state = useAppState()
  const dispatch = useAppDispatch()

  const isDone = state.screen === 'done'
  const progress = state.progress
  const total = progress?.total ?? state.photos.filter((p) => p.sel).length

  const fraction = progress
    ? (progress.index + (progress.bytesTotal > 0 ? progress.bytesDone / progress.bytesTotal : 0)) / Math.max(1, progress.total)
    : 0
  const pct = Math.round(Math.min(1, fraction) * 100)
  const doneCount = progress ? Math.min(progress.total, Math.round(fraction * progress.total)) : 0

  function cancel(): void {
    window.api.cancelCopy()
    dispatch({ type: 'cancelCopy' })
  }

  function openFolder(): void {
    if (state.doneInfo) window.api.showItemInFolder(state.doneInfo.destDir)
  }

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
        background: 'rgba(9,10,13,.82)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 472,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,.6)',
          padding: 30,
          animation: 'kpop .2s ease'
        }}
      >
        {!isDone && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 13,
                background: 'var(--card)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}
            >
              <CopyIcon />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 22 }}>
              {state.mode === 'copy' ? 'Copying' : 'Moving'} {total} photos…
            </div>
            <div style={{ width: '100%', height: 8, borderRadius: 5, background: 'var(--bg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 5, transition: 'width .12s linear' }} />
            </div>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>{doneCount}</span> / {total}
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted-dim)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--muted-dim)',
                marginTop: 14,
                fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              {progress?.file ?? ''}
            </div>
            <button
              onClick={cancel}
              className="hover-link"
              style={{ background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer', marginTop: 22 }}
            >
              Cancel
            </button>
          </div>
        )}

        {isDone && state.doneInfo && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', animation: 'kfade .3s ease' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(70,167,88,0.14)',
                border: '1px solid rgba(70,167,88,.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20
              }}
            >
              <CheckIcon size={32} color="var(--success)" strokeWidth={2.6} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, letterSpacing: '-.01em' }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{state.doneInfo.succeeded}</span> photos{' '}
              {state.doneInfo.mode === 'copy' ? 'copied' : 'moved'}
              {state.doneInfo.cancelled ? ' (cancelled)' : ''}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 26, lineHeight: 1.5 }}>
              to <span style={{ color: 'var(--text)' }}>{state.doneInfo.destDir}</span>
              {state.doneInfo.failed.length > 0 && (
                <>
                  <br />
                  {state.doneInfo.failed.length} file(s) failed and were left in place.
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                onClick={openFolder}
                className="hover-btn-ghost"
                style={{
                  flex: 1,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: 12,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Open folder
              </button>
              <button
                onClick={() => dispatch({ type: 'startNew' })}
                className="hover-brighten"
                style={{
                  flex: 1,
                  background: 'var(--accent)',
                  color: 'var(--accent-ink)',
                  border: 'none',
                  padding: 12,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Start a new selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
