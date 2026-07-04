import type sharp from 'sharp'

/** Standard EXIF Orientation (1-8) → sharp rotate/flip transform. */
export function applyExifOrientation(pipeline: sharp.Sharp, orientation: number): sharp.Sharp {
  switch (orientation) {
    case 2:
      return pipeline.flop()
    case 3:
      return pipeline.rotate(180)
    case 4:
      return pipeline.flip()
    case 5:
      return pipeline.rotate(90).flip()
    case 6:
      return pipeline.rotate(90)
    case 7:
      return pipeline.rotate(270).flip()
    case 8:
      return pipeline.rotate(270)
    default:
      return pipeline
  }
}
