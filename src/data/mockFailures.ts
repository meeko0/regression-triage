import type { ErrorGroup, Failure, Status } from '../types'

// Mock data only. Part names, assemblies, and run IDs are invented.
// Nothing here comes from a real vehicle program or internal system.

export const RUN_ID = 'NIGHTLY-2026-11-12'
export const RUN_START = '2026-11-12T23:00:00.000Z'

const PARTS = [
  'Front Closure Hinge Bracket',
  'Pack Tray Cross Rail',
  'Seat Track Mount',
  'Charge Port Housing',
  'Underbody Crossmember',
  'Roof Rack Anchor',
  'Harness Clip Block',
  'Tailgate Latch Bracket',
  'Cockpit Carrier Panel',
  'Inverter Standoff',
  'Sill Reinforcement',
  'Wheel House Liner Tab',
]

const ASSEMBLIES = [
  'Front Closure',
  'Body in White',
  'Battery Pack',
  'Cockpit',
  'Chassis',
  'Power Electronics',
]

const CASES: Record<ErrorGroup, { summary: string; action: string }[]> = {
  Interference: [
    {
      summary: 'Swept volume intersects the harness route during door open',
      action: 'Move the clip 6 mm rearward and re-run the swept-volume check.',
    },
    {
      summary: 'Fastener head clears the panel by less than the minimum gap',
      action: 'Confirm the gap target with the closure team before changing geometry.',
    },
  ],
  Constraints: [
    {
      summary: 'Mate constraint lost after the bracket was re-parented',
      action: 'Restore the original mate reference and re-validate the assembly.',
    },
    {
      summary: 'Alignment constraint drifts beyond tolerance on the reference build',
      action: 'Review the tolerance stack and add a locating feature if needed.',
    },
  ],
  Mass: [
    {
      summary: 'Estimated mass exceeds the subsystem budget by 0.8 kg',
      action: 'Propose a thinner gauge or lightening holes and re-run the mass rollup.',
    },
    {
      summary: 'Mass rollup double-counts a shared fastener kit',
      action: 'Remove the duplicate line item from the BOM and confirm the total.',
    },
  ],
  References: [
    {
      summary: 'Reference to a superseded part revision in the assembly tree',
      action: 'Update the reference to the current revision and re-run the regression.',
    },
    {
      summary: 'Broken external link to a shared skeleton',
      action: 'Re-point the link to the released skeleton and check dependent parts.',
    },
  ],
}

const GROUPS: ErrorGroup[] = ['Interference', 'Constraints', 'Mass', 'References']

// Small seeded PRNG so the mock run is the same on every load.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function statusFor(roll: number): Status {
  if (roll < 0.55) return 'open'
  if (roll < 0.8) return 'investigating'
  return 'resolved'
}

export function buildMockFailures(count = 48, seed = 20261112): Failure[] {
  const rand = mulberry32(seed)
  const start = Date.parse(RUN_START)

  return Array.from({ length: count }, (_, i) => {
    const group = GROUPS[Math.floor(rand() * GROUPS.length)]
    const variants = CASES[group]
    const variant = variants[Math.floor(rand() * variants.length)]
    const part = PARTS[Math.floor(rand() * PARTS.length)]
    const code = `${String.fromCharCode(65 + Math.floor(rand() * 26))}-${10 + Math.floor(rand() * 89)}`

    return {
      id: `RT-${String(i + 1).padStart(3, '0')}`,
      part: `${part} ${code}`,
      assembly: ASSEMBLIES[Math.floor(rand() * ASSEMBLIES.length)],
      group,
      summary: variant.summary,
      suggestedAction: variant.action,
      risk: Math.round(rand() * 100),
      status: statusFor(rand()),
      detectedAt: new Date(start + i * 7 * 60_000).toISOString(),
    }
  })
}

export const MOCK_FAILURES: Failure[] = buildMockFailures()
