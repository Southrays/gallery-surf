/// <reference types="vite/client" />

import type { GallerySurfApi } from '../../shared/types'

interface WindowControlsOverlay {
  readonly visible: boolean
  getTitlebarAreaRect(): DOMRect
  addEventListener(type: 'geometrychange', listener: () => void): void
  removeEventListener(type: 'geometrychange', listener: () => void): void
}

declare global {
  interface Window {
    api: GallerySurfApi
  }
  interface Navigator {
    readonly windowControlsOverlay?: WindowControlsOverlay
  }
}
