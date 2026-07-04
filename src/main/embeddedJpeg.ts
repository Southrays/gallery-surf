const SOI_PREFIX = Buffer.from([0xff, 0xd8, 0xff])
const EOI = Buffer.from([0xff, 0xd9])

interface Candidate {
  start: number
  end: number
}

/** Finds every plausible JPEG blob (SOI…EOI) embedded in an arbitrary file buffer. */
function findJpegCandidates(buf: Buffer): Candidate[] {
  const out: Candidate[] = []
  let searchFrom = 0

  while (searchFrom < buf.length) {
    const soi = buf.indexOf(SOI_PREFIX, searchFrom)
    if (soi === -1) break

    const eoi = buf.indexOf(EOI, soi + 3)
    if (eoi === -1) {
      // No terminator found for this SOI — nothing usable after it either.
      break
    }

    out.push({ start: soi, end: eoi + 2 })
    searchFrom = eoi + 2
  }

  return out
}

/**
 * RAW (CR3/CR2/NEF/ARW/DNG/RAF/RW2/ORF) and HEIC/HEIF files embed one or more
 * JPEG previews for the camera's own LCD/quick-browse. Rather than a full
 * raw demosaic or a native HEIF codec, pull the largest embedded JPEG blob
 * out by byte-scanning for SOI/EOI markers — this is how fast culling tools
 * (Photo Mechanic, FastRawViewer) get instant previews too.
 */
export async function extractLargestEmbeddedJpeg(buf: Buffer): Promise<Buffer | null> {
  const candidates = findJpegCandidates(buf)
  if (candidates.length === 0) return null

  // Byte length is a fast, good-enough proxy for pixel dimensions here —
  // decoding metadata for every candidate just to compare would cost more
  // than it saves given raw files typically embed only 1-3 previews.
  let best: Candidate | null = null
  for (const c of candidates) {
    if (!best || c.end - c.start > best.end - best.start) best = c
  }
  if (!best) return null

  return buf.subarray(best.start, best.end)
}
