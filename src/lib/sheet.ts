/** Drag the sheet down further than this many pixels to close it. */
export const CLOSE_DISTANCE = 120
/** Or flick it down faster than this, in pixels per second. */
export const CLOSE_VELOCITY = 600

export function shouldClose(info: { offset: { y: number }; velocity: { y: number } }) {
  return info.offset.y > CLOSE_DISTANCE || info.velocity.y > CLOSE_VELOCITY
}
