import { protocol, net } from 'electron'
import { join, normalize } from 'node:path'
import { pathToFileURL } from 'node:url'
import { THUMBS_DIR, PREVIEWS_DIR } from './paths'

export const CACHE_SCHEME = 'gallery-surf-cache'

export function registerCacheSchemeAsPrivileged(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: CACHE_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ])
}

/** Serves only from the app's own thumbs/previews cache dirs — never an
 *  arbitrary source/destination folder — via `gallery-surf-cache://thumbs/<file>`
 *  and `gallery-surf-cache://previews/<file>`. */
export function registerCacheProtocolHandler(): void {
  protocol.handle(CACHE_SCHEME, (request) => {
    const url = new URL(request.url)
    const bucket = url.host // "thumbs" | "previews"
    const baseDir = bucket === 'thumbs' ? THUMBS_DIR() : bucket === 'previews' ? PREVIEWS_DIR() : null
    if (!baseDir) return new Response('not found', { status: 404 })

    const requestedPath = normalize(join(baseDir, decodeURIComponent(url.pathname)))
    if (!requestedPath.startsWith(normalize(baseDir))) {
      return new Response('forbidden', { status: 403 })
    }

    return net.fetch(pathToFileURL(requestedPath).toString())
  })
}

export function toCacheUrl(bucket: 'thumbs' | 'previews', absoluteCachePath: string): string {
  const filename = absoluteCachePath.split(/[\\/]/).pop()
  return `${CACHE_SCHEME}://${bucket}/${filename}`
}
