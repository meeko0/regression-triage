import { describe, expect, it } from 'vitest'
import { CLOSE_DISTANCE, CLOSE_VELOCITY, shouldClose } from './sheet'

describe('shouldClose', () => {
  it('closes after a long enough drag down', () => {
    expect(shouldClose({ offset: { y: CLOSE_DISTANCE + 1 }, velocity: { y: 0 } })).toBe(true)
    expect(shouldClose({ offset: { y: CLOSE_DISTANCE - 1 }, velocity: { y: 0 } })).toBe(false)
  })

  it('closes after a fast flick, even a short one', () => {
    expect(shouldClose({ offset: { y: 20 }, velocity: { y: CLOSE_VELOCITY + 1 } })).toBe(true)
  })

  it('stays open when dragged up', () => {
    expect(shouldClose({ offset: { y: -200 }, velocity: { y: -900 } })).toBe(false)
  })
})
