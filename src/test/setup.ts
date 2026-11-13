import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { useTriageStore } from '../store/triageStore'
import { resetMockServer } from '../api/failures'
import { useNotesStore } from '../store/notesStore'

afterEach(() => {
  cleanup()
  resetMockServer()
  useTriageStore.getState().reset()
  useNotesStore.getState().reset()
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})
