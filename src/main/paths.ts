import { app } from 'electron'
import { join } from 'node:path'
import { mkdirSync } from 'node:fs'

export const THUMBS_DIR = (): string => join(app.getPath('userData'), 'thumbs')
export const PREVIEWS_DIR = (): string => join(app.getPath('userData'), 'previews')
export const RECENTS_FILE = (): string => join(app.getPath('userData'), 'recents.json')
export const SETTINGS_FILE = (): string => join(app.getPath('userData'), 'settings.json')
export const SELECTIONS_DIR = (): string => join(app.getPath('userData'), 'selections')

export function ensureCacheDirs(): void {
  mkdirSync(THUMBS_DIR(), { recursive: true })
  mkdirSync(PREVIEWS_DIR(), { recursive: true })
  mkdirSync(SELECTIONS_DIR(), { recursive: true })
}
