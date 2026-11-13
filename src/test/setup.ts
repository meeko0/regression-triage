import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { useTriageStore } from '../store/triageStore'
import { resetMockServer } from '../api/failures'

afterEach(() => {
  cleanup()
  resetMockServer()
  useTriageStore.getState().reset()
  window.history.replaceState(null, '', '/')
})
