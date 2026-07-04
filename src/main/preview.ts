import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { cpus } from 'node:os'
import sharp from 'sharp'
import type { Priority } from '../shared/types'
import { RAW_LIKE_EXTENSIONS } from '../shared/types'
import { THUMBS_DIR, PREVIEWS_DIR } from './paths'
import { extractLargestEmbeddedJpeg } from './embeddedJpeg'
import { readTiffOrientation } from './tiffOrientation'
import { applyExifOrientation } from './exifOrient'

const THUMB_LONG_EDGE = 480
const PREVIEW_LONG_EDGE = 2048
const HEIF_EXTENSIONS = new Set(['heic', 'heif'])

export interface GeneratedImage {
  path: string
  width: number
  height: number
}

function cacheKey(path: string, mtimeMs: number, size: number): string {
  return createHash('sha1').update(`${path}|${mtimeMs}|${size}`).digest('hex')
}

const PRIORITY_RANK: Record<Priority, number> = { urgent: 2, high: 1, normal: 0 }

/**
 * Caps how many files are being decoded at once so a big folder doesn't
 * saturate disk I/O / native decode threads all at once — while letting
 * interactive requests jump ahead of bulk background work, so navigating
 * stays fast even while a big folder is still generating previews.
 *
 * Three tiers, dequeued urgent → high → normal: 'urgent' is reserved for
 * whichever photo is on screen *right now*, so a burst of fast navigation
 * (which queues a 'high' neighbor-prefetch task on every step) can never
 * make the actual current photo wait behind a pile of stale prefetch work.
 *
 * `schedule` returns immediately with a promise plus a `promote` function:
 * a task queued at a lower tier can be moved up later if it turns out to be
 * needed more urgently after all (see the in-flight de-dup below) — without
 * that, a photo the background warm pass already started generating would
 * be stuck behind the rest of the folder even once the user navigates to it.
 */
class PriorityLimiter {
  private active = 0
  private readonly queues: Record<Priority, Array<() => void>> = { urgent: [], high: [], normal: [] }
  constructor(private readonly max: number) {}

  schedule<T>(fn: () => Promise<T>, priority: Priority): { promise: Promise<T>; promote: (to: Priority) => void } {
    const runNow = (): Promise<T> => {
      this.active++
      return fn().finally(() => {
        this.active--
        const next = this.queues.urgent.shift() ?? this.queues.high.shift() ?? this.queues.normal.shift()
        if (next) next()
      })
    }

    if (this.active < this.max) {
      return { promise: runNow(), promote: () => {} }
    }

    let start: (() => void) | null = null
    let queuedAt = priority
    const promise = new Promise<T>((resolveOuter) => {
      start = () => resolveOuter(runNow())
      this.queues[priority].push(start)
    })

    const promote = (to: Priority): void => {
      if (!start) return
      const idx = this.queues[queuedAt].indexOf(start)
      if (idx !== -1) {
        this.queues[queuedAt].splice(idx, 1)
        this.queues[to].push(start)
        queuedAt = to
      }
    }

    return { promise, promote }
  }
}

const limiter = new PriorityLimiter(Math.max(2, Math.min(8, cpus().length)))

interface InFlight {
  promise: Promise<GeneratedImage | null>
  priority: Priority
  promote: (to: Priority) => void
}

/** Keyed by cache path — de-dupes concurrent requests for the same photo
 *  (so the background warm pass and an interactive request never decode the
 *  same file twice) and lets a later, more urgent request promote an already
 *  in-flight lower-priority one instead of just quietly waiting behind it. */
const inFlight = new Map<string, InFlight>()

/**
 * Builds the decode pipeline(s) to try, in priority order, for a given file.
 * RAW/HEIC previews are extracted embedded JPEGs that usually carry *no*
 * orientation tag of their own (the camera stores it once, on the parent
 * container) — so beyond auto-rotating the extracted blob, we also fall back
 * to reading the parent's own orientation and applying it explicitly.
 * Otherwise portrait shots come out in the sensor's native (often landscape)
 * orientation.
 */
async function buildPipelineAttempts(path: string, ext: string): Promise<Array<() => sharp.Sharp>> {
  if (!RAW_LIKE_EXTENSIONS.has(ext)) {
    // Plain JPEG/PNG — sharp decodes the file directly and honors its own EXIF.
    return [() => sharp(path).rotate()]
  }

  const attempts: Array<() => sharp.Sharp> = []

  if (HEIF_EXTENSIONS.has(ext)) {
    // sharp's bundled libvips has real HEIF decode support — prefer decoding
    // the actual full image (with its own correct orientation) over the
    // lower-resolution embedded-JPEG-scan fallback.
    attempts.push(() => sharp(path).rotate())
  }

  const raw = await readFile(path)
  const jpeg = await extractLargestEmbeddedJpeg(raw)
  if (jpeg) {
    const blobMeta = await sharp(jpeg)
      .metadata()
      .catch(() => undefined)

    if (blobMeta?.orientation && blobMeta.orientation !== 1) {
      // The extracted preview carries its own orientation tag — trust it.
      attempts.push(() => sharp(jpeg).rotate())
    } else {
      // No usable tag on the blob itself — read it from the parent
      // container (works for TIFF-based raws: NEF/ARW/CR2/DNG/RW2/ORF).
      const parentOrientation = readTiffOrientation(raw)
      attempts.push(() =>
        parentOrientation && parentOrientation !== 1
          ? applyExifOrientation(sharp(jpeg), parentOrientation)
          : sharp(jpeg).rotate()
      )
    }
  }

  return attempts
}

async function readDims(cachePath: string): Promise<GeneratedImage> {
  const meta = await sharp(cachePath).metadata()
  return { path: cachePath, width: meta.width ?? 0, height: meta.height ?? 0 }
}

async function generate(
  path: string,
  ext: string,
  mtimeMs: number,
  size: number,
  cacheDir: string,
  longEdge: number,
  quality: number,
  priority: Priority
): Promise<GeneratedImage | null> {
  const key = cacheKey(path, mtimeMs, size)
  const cachePath = join(cacheDir, `${key}.jpg`)
  if (existsSync(cachePath)) return readDims(cachePath)

  const existing = inFlight.get(cachePath)
  if (existing) {
    if (PRIORITY_RANK[priority] > PRIORITY_RANK[existing.priority]) {
      existing.priority = priority
      existing.promote(priority)
    }
    return existing.promise
  }

  const { promise, promote } = limiter.schedule(async () => {
    if (existsSync(cachePath)) return readDims(cachePath) // re-check post-queue

    const attempts = await buildPipelineAttempts(path, ext)

    for (const makePipeline of attempts) {
      try {
        await makePipeline()
          .resize({ width: longEdge, height: longEdge, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality })
          .toFile(cachePath)
        return readDims(cachePath)
      } catch {
        // try the next strategy, if any
      }
    }
    return null
  }, priority)

  const entry: InFlight = { promise, priority, promote }
  inFlight.set(cachePath, entry)
  promise.finally(() => {
    if (inFlight.get(cachePath) === entry) inFlight.delete(cachePath)
  })
  return promise
}

export async function getThumbnailPath(
  path: string,
  ext: string,
  mtimeMs: number,
  size: number,
  priority: Priority
): Promise<GeneratedImage | null> {
  return generate(path, ext, mtimeMs, size, THUMBS_DIR(), THUMB_LONG_EDGE, 82, priority)
}

export async function getPreviewPath(
  path: string,
  ext: string,
  mtimeMs: number,
  size: number,
  priority: Priority
): Promise<GeneratedImage | null> {
  return generate(path, ext, mtimeMs, size, PREVIEWS_DIR(), PREVIEW_LONG_EDGE, 88, priority)
}
