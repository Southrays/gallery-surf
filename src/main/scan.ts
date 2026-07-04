import { readdir, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { createHash } from 'node:crypto'
import type { PhotoMeta } from '../shared/types'
import { SUPPORTED_EXTENSIONS } from '../shared/types'

const EXT_SET = new Set(SUPPORTED_EXTENSIONS)

function idFor(path: string, mtimeMs: number, size: number): string {
  return createHash('sha1').update(`${path}|${mtimeMs}|${size}`).digest('hex')
}

/** Stats every candidate file (and recurses into subfolders) concurrently
 *  instead of one at a time — for a folder with thousands of photos, awaiting
 *  `stat` sequentially was the main reason opening a big folder felt slow. */
async function walk(dirPath: string, recursive: boolean, out: PhotoMeta[]): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const tasks: Promise<void>[] = []

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name)

    if (entry.isDirectory()) {
      if (recursive) tasks.push(walk(fullPath, recursive, out))
      continue
    }
    if (!entry.isFile()) continue

    const ext = extname(entry.name).replace('.', '').toLowerCase()
    if (!EXT_SET.has(ext)) continue

    tasks.push(
      stat(fullPath).then((s) => {
        out.push({
          id: idFor(fullPath, s.mtimeMs, s.size),
          path: fullPath,
          name: entry.name,
          ext,
          size: s.size,
          mtimeMs: s.mtimeMs
        })
      })
    )
  }

  await Promise.all(tasks)
}

/** Top-level files by default; pass `recursive` to also pull images out of
 *  subfolders (nested album/date folders, camera card DCIM structures, etc). */
export async function scanFolder(dirPath: string, recursive: boolean): Promise<PhotoMeta[]> {
  const out: PhotoMeta[] = []
  await walk(dirPath, recursive, out)
  out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  return out
}
