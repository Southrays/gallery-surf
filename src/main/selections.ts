import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { SELECTIONS_DIR } from './paths'

export interface PhotoFlags {
  sel: boolean
  rej: boolean
}

function fileFor(folderPath: string): string {
  const key = createHash('sha1').update(folderPath).digest('hex')
  return join(SELECTIONS_DIR(), `${key}.json`)
}

/** Selections are keyed by each photo's id (a hash of path+mtime+size, see
 *  scan.ts) rather than plain path — so if a file gets replaced with
 *  different content, its stale selection doesn't silently carry over. */
export async function loadSelections(folderPath: string): Promise<Record<string, PhotoFlags>> {
  const file = fileFor(folderPath)
  if (!existsSync(file)) return {}
  try {
    const raw = await readFile(file, 'utf-8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export async function saveSelections(folderPath: string, flags: Record<string, PhotoFlags>): Promise<void> {
  await writeFile(fileFor(folderPath), JSON.stringify(flags), 'utf-8')
}
