import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import type { AppSettings } from '../shared/types'
import { SETTINGS_FILE } from './paths'

const DEFAULT_SETTINGS: AppSettings = {
  includeSubfolders: false,
  filmstripHeight: 98,
  filmstripCollapsed: false
}

async function readSettings(): Promise<AppSettings> {
  const file = SETTINGS_FILE()
  if (!existsSync(file)) return DEFAULT_SETTINGS
  try {
    const raw = await readFile(file, 'utf-8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function getSettings(): Promise<AppSettings> {
  return readSettings()
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await readSettings()), ...patch }
  await writeFile(SETTINGS_FILE(), JSON.stringify(next, null, 2), 'utf-8')
  return next
}
