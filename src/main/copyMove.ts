import { createReadStream, createWriteStream, existsSync } from 'node:fs'
import { mkdir, stat, unlink } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import type { BrowserWindow } from 'electron'
import type { CopyDonePayload, CopyOrMoveRequest, CopyProgressPayload } from '../shared/types'

let cancelRequested = false

export function cancelCopy(): void {
  cancelRequested = true
}

async function uniqueDestPath(dir: string, filename: string): Promise<string> {
  const ext = extname(filename)
  const base = filename.slice(0, filename.length - ext.length)
  let candidate = join(dir, filename)
  let n = 2
  while (existsSync(candidate)) {
    candidate = join(dir, `${base} (${n})${ext}`)
    n++
  }
  return candidate
}

function copyFileWithProgress(
  src: string,
  dest: string,
  totalBytes: number,
  onBytes: (done: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(src)
    const writeStream = createWriteStream(dest)
    let done = 0

    readStream.on('data', (chunk) => {
      done += chunk.length
      onBytes(Math.min(done, totalBytes))
    })
    readStream.on('error', reject)
    writeStream.on('error', reject)
    writeStream.on('finish', resolve)

    readStream.pipe(writeStream)
  })
}

export async function copyOrMove(win: BrowserWindow, req: CopyOrMoveRequest): Promise<void> {
  cancelRequested = false
  const { files, destDir, subfolder, mode } = req
  const finalDir = subfolder.trim() ? join(destDir, subfolder.trim()) : destDir
  await mkdir(finalDir, { recursive: true })

  const total = files.length
  const failed: Array<{ file: string; error: string }> = []
  let succeeded = 0
  let cancelled = false

  for (let index = 0; index < files.length; index++) {
    if (cancelRequested) {
      cancelled = true
      break
    }

    const srcPath = files[index]
    const name = basename(srcPath)

    try {
      const srcStat = await stat(srcPath)
      const destPath = await uniqueDestPath(finalDir, name)

      const emit = (bytesDone: number): void => {
        const payload: CopyProgressPayload = {
          index,
          total,
          file: name,
          bytesDone,
          bytesTotal: srcStat.size
        }
        win.webContents.send('copy-progress', payload)
      }

      await copyFileWithProgress(srcPath, destPath, srcStat.size, emit)

      // Verify before doing anything destructive to the original.
      const destStat = await stat(destPath)
      if (destStat.size !== srcStat.size) {
        throw new Error('copied size did not match source — refusing to delete original')
      }

      if (mode === 'move') {
        await unlink(srcPath)
      }

      succeeded++
      emit(srcStat.size)
    } catch (err) {
      failed.push({ file: name, error: err instanceof Error ? err.message : String(err) })
    }
  }

  const donePayload: CopyDonePayload = {
    total,
    succeeded,
    failed,
    cancelled,
    destDir: finalDir,
    mode
  }
  win.webContents.send('copy-done', donePayload)
}
