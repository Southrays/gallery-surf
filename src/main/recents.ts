import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import type { RecentEntry } from '../shared/types'
import { RECENTS_FILE } from './paths'

const MAX_RECENTS = 10

export async function listRecents(): Promise<RecentEntry[]> {
  const file = RECENTS_FILE()
  if (!existsSync(file)) return []
  try {
    const raw = await readFile(file, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function addRecent(entry: RecentEntry): Promise<void> {
  const current = await listRecents()
  const deduped = current.filter((r) => r.path !== entry.path)
  const next = [entry, ...deduped].slice(0, MAX_RECENTS)
  await writeFile(RECENTS_FILE(), JSON.stringify(next, null, 2), 'utf-8')
}

export async function removeRecent(path: string): Promise<void> {
  const current = await listRecents()
  const next = current.filter((r) => r.path !== path)
  await writeFile(RECENTS_FILE(), JSON.stringify(next, null, 2), 'utf-8')
}
