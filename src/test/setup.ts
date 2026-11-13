import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { MotionGlobalConfig } from 'motion/react'
import { cleanup } from '@testing-library/react'
import { useTriageStore } from '../store/triageStore'
import { resetMockServer } from '../api/failures'
import { useNotesStore } from '../store/notesStore'

// jsdom has no real animation frames, so exit animations can stall and leave old content mounted.
// Tests check behavior, not motion, so make every animation finish at once.
MotionGlobalConfig.skipAnimations = true

afterEach(() => {
  cleanup()
  resetMockServer()
  useTriageStore.getState().reset()
  useNotesStore.getState().reset()
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})
