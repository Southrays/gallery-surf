import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageResult, Priority } from '../../../shared/types'

export type Kind = 'thumb' | 'preview'
export type LoadStatus = 'loading' | 'ready' | 'error'

const PRIORITY_RANK: Record<Priority, number> = { urgent: 2, high: 1, normal: 0 }

interface CacheEntry {
  promise: Promise<ImageResult | null>
  priority: Priority
  settled: boolean
}

const thumbCache = new Map<string, CacheEntry>()
const previewCache = new Map<string, CacheEntry>()

function cacheFor(kind: Kind): Map<string, CacheEntry> {
  return kind === 'thumb' ? thumbCache : previewCache
}

function callApi(path: string, kind: Kind, priority: Priority): Promise<ImageResult | null> {
  return kind === 'thumb' ? window.api.getThumbnail(path, priority) : window.api.getPreview(path, priority)
}

function fetchImage(path: string, kind: Kind, priority: Priority): Promise<ImageResult | null> {
  const cache = cacheFor(kind)
  const existing = cache.get(path)

  // Once resolved, the URL never changes for this (path, mtime, size) — just
  // reuse it. While still pending, a request that escalates to a higher tier
  // (e.g. the background warm pass already started this photo at 'normal',
  // and the user then navigated to it, making it 'urgent') needs to actually
  // ask again: the main process de-dupes this against the in-flight
  // generation and promotes its queue position, instead of the caller
  // silently waiting behind the rest of the folder.
  if (existing && (existing.settled || PRIORITY_RANK[priority] <= PRIORITY_RANK[existing.priority])) {
    return existing.promise
  }

  const promise = callApi(path, kind, priority)
  const entry: CacheEntry = { promise, priority, settled: false }
  cache.set(path, entry)
  promise.finally(() => {
    entry.settled = true
  })
  return promise
}

/** Warms the cache for a path without a component needing to render it yet —
 *  used to prefetch the next/previous photo in Loupe so navigation feels instant. */
export function prefetchImage(path: string, kind: Kind, priority: Priority = 'high'): void {
  fetchImage(path, kind, priority)
}

// One shared IntersectionObserver for every tile, instead of one per tile —
// a big folder can mean thousands of grid/filmstrip tiles, and only the
// ones actually near the viewport should trigger a decode request.
let sharedObserver: IntersectionObserver | null = null
const observerCallbacks = new WeakMap<Element, () => void>()

function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const cb = observerCallbacks.get(entry.target)
          if (cb) cb()
          sharedObserver?.unobserve(entry.target)
          observerCallbacks.delete(entry.target)
        }
      },
      { rootMargin: '800px 0px' }
    )
  }
  return sharedObserver
}

export interface LazyImage {
  /** Attach to the tile's container element to gate loading on visibility. */
  ref: (el: Element | null) => void
  status: LoadStatus
  url: string | null
  width: number | null
  height: number | null
}

/**
 * Loads (and memoizes) the cached-thumbnail/preview URL for a photo path.
 * By default only starts the actual generation request once the element is
 * within `rootMargin` of the viewport (`lazy: true`), so opening a folder
 * with thousands of photos doesn't fire thousands of concurrent decodes —
 * only requests the handful that are actually about to be visible.
 */
export function useLazyImage(
  path: string,
  kind: Kind,
  opts: { lazy?: boolean; priority?: Priority } = {}
): LazyImage {
  const { lazy = true, priority = 'normal' } = opts
  const [visible, setVisible] = useState(!lazy)
  const [result, setResult] = useState<ImageResult | null | undefined>(undefined)
  const elRef = useRef<Element | null>(null)

  const ref = useCallback(
    (el: Element | null) => {
      const prev = elRef.current
      if (prev && observerCallbacks.has(prev)) {
        getObserver().unobserve(prev)
        observerCallbacks.delete(prev)
      }
      elRef.current = el
      if (el && lazy) {
        observerCallbacks.set(el, () => setVisible(true))
        getObserver().observe(el)
      }
    },
    [lazy]
  )

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    setResult(undefined)
    fetchImage(path, kind, priority).then((r) => {
      if (!cancelled) setResult(r)
    })
    return () => {
      cancelled = true
    }
  }, [path, kind, priority, visible])

  const status: LoadStatus = result === undefined ? 'loading' : result === null ? 'error' : 'ready'
  return {
    ref,
    status,
    url: result?.url ?? null,
    width: result?.width ?? null,
    height: result?.height ?? null
  }
}
