import { MOCK_FAILURES } from '../data/mockFailures'
import type { Failure, Status } from '../types'

// In-memory stand-in for a real API. Swap these two functions for fetch calls later.
let server: Failure[] = MOCK_FAILURES.map(f => ({ ...f }))

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchFailures(): Promise<Failure[]> {
  await delay(350)
  return server.map(f => ({ ...f }))
}

export async function updateFailureStatus(id: string, status: Status): Promise<Failure> {
  await delay(250)
  const index = server.findIndex(f => f.id === id)
  if (index === -1) {
    throw new Error(`Failure ${id} was not found`)
  }
  server[index] = { ...server[index], status }
  return { ...server[index] }
}

// Test helper: restores the seeded data between test cases.
export function resetMockServer() {
  server = MOCK_FAILURES.map(f => ({ ...f }))
}
