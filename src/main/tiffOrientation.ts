const ORIENTATION_TAG = 0x0112

/**
 * Reads the EXIF Orientation tag (0x0112) straight out of a TIFF-structured
 * file's IFD0 — NEF, ARW, CR2, and DNG are all TIFF/EP derivatives, so this
 * works uniformly across them without needing libtiff to fully open the file
 * (which can choke on camera-specific compression in the image strips).
 *
 * This deliberately only reads the container header, never touches pixel
 * data, so it's cheap and safe to run on every RAW file.
 */
export function readTiffOrientation(buf: Buffer): number | undefined {
  if (buf.length < 8) return undefined

  let littleEndian: boolean
  if (buf[0] === 0x49 && buf[1] === 0x49) littleEndian = true
  else if (buf[0] === 0x4d && buf[1] === 0x4d) littleEndian = false
  else return undefined // not a TIFF-structured file (e.g. CR3/ISOBMFF)

  const magic = littleEndian ? buf.readUInt16LE(2) : buf.readUInt16BE(2)
  if (magic !== 42) return undefined

  const ifd0Offset = littleEndian ? buf.readUInt32LE(4) : buf.readUInt32BE(4)
  if (ifd0Offset + 2 > buf.length) return undefined

  const entryCount = littleEndian ? buf.readUInt16LE(ifd0Offset) : buf.readUInt16BE(ifd0Offset)
  const entriesStart = ifd0Offset + 2

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = entriesStart + i * 12
    if (entryOffset + 12 > buf.length) break

    const tag = littleEndian ? buf.readUInt16LE(entryOffset) : buf.readUInt16BE(entryOffset)
    if (tag !== ORIENTATION_TAG) continue

    // Orientation is type SHORT with count 1, so the value sits in the
    // first 2 bytes of the 4-byte value/offset field.
    const valueFieldOffset = entryOffset + 8
    const value = littleEndian ? buf.readUInt16LE(valueFieldOffset) : buf.readUInt16BE(valueFieldOffset)
    return value >= 1 && value <= 8 ? value : undefined
  }

  return undefined
}
