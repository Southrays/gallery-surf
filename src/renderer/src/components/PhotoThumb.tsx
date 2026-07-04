import type { Priority } from '../../../shared/types'
import { useLazyImage } from '../hooks/useImageUrl'

export function PhotoThumb({
  path,
  ext,
  kind = 'thumb',
  priority = 'normal',
  lazy = true,
  style
}: {
  path: string
  ext: string
  kind?: 'thumb' | 'preview'
  priority?: Priority
  lazy?: boolean
  style?: React.CSSProperties
}): React.JSX.Element {
  const { ref, status, url } = useLazyImage(path, kind, { lazy, priority })

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        contentVisibility: 'auto',
        containIntrinsicSize: '188px 141px',
        ...style
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
            background: '#22262e',
            color: '#656b76',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '.04em'
          }}
        >
          {ext.toUpperCase()}
        </div>
      )}
    </div>
  )
}
