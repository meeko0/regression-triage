// Reports WCAG 2.x contrast for every foreground/background pair the UI uses.
//
// Colors come from src/styles/tokens.json. The pair list below is the usage map: each entry says
// which token sits on which, and what kind of content it is, which sets the threshold.
//   text  : body and small text, needs 4.5:1 (WCAG 1.4.3 AA)
//   large : 24px+ regular or 18.66px+ bold text, needs 3:1 (WCAG 1.4.3 AA)
//   ui    : fills, borders, and focus rings that carry meaning, needs 3:1 (WCAG 1.4.11)
//
// Exits with code 1 if any pair fails, so it can gate CI.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tokens = JSON.parse(readFileSync(join(root, 'src/styles/tokens.json'), 'utf8'))

const THRESHOLD = { text: 4.5, large: 3, ui: 3 }

// fg and bg are token paths under "color". Append "@0.7" to apply alpha to the foreground.
export const PAIRS = [
  // Page surface
  { fg: 'primary', bg: 'paper', kind: 'text', use: 'Body text, headings, rows' },
  { fg: 'muted', bg: 'paper', kind: 'text', use: 'Labels, metadata, secondary text' },
  { fg: 'accent', bg: 'paper', kind: 'large', use: 'Display accents (24px+ Orbitron)' },
  { fg: 'accent', bg: 'paper', kind: 'ui', use: 'Focus ring, accent rules and fills' },
  { fg: 'primary', bg: 'paper', kind: 'ui', use: 'Borders on buttons, panel outline' },
  // Inverted surfaces (selected row, solid button, active chip)
  { fg: 'paper', bg: 'primary', kind: 'text', use: 'Selected row, solid button, active chip' },
  { fg: 'paper@0.75', bg: 'primary', kind: 'text', use: 'Selected row secondary text' },
  { fg: 'accent-soft', bg: 'primary', kind: 'ui', use: 'Focus ring on navy surfaces' },
  { fg: 'accent-soft', bg: 'primary', kind: 'text', use: 'Accent text on navy (counts, labels)' },
  // Accent fill
  { fg: 'paper', bg: 'accent', kind: 'large', use: 'Large text on olive fill' },
  // Risk
  { fg: 'risk.high', bg: 'paper', kind: 'text', use: '"Blocking" label, error text' },
  { fg: 'risk.mid', bg: 'paper', kind: 'text', use: 'Mid risk label' },
  { fg: 'risk.low', bg: 'paper', kind: 'text', use: 'Low risk label' },
  { fg: 'risk.high', bg: 'paper', kind: 'ui', use: 'High risk bar fill' },
  { fg: 'risk.mid', bg: 'paper', kind: 'ui', use: 'Mid risk bar fill' },
  { fg: 'risk.low', bg: 'paper', kind: 'ui', use: 'Low risk bar fill' },
  { fg: 'risk.high', bg: 'line', kind: 'ui', use: 'High risk fill against its track' },
  { fg: 'risk.mid', bg: 'line', kind: 'ui', use: 'Mid risk fill against its track' },
  { fg: 'risk.low', bg: 'line', kind: 'ui', use: 'Low risk fill against its track' },
  { fg: 'paper', bg: 'risk.high', kind: 'text', use: 'Overdue badge text' },
]

function lookup(path) {
  let node = tokens.color
  for (const key of path.split('.')) node = node?.[key]
  if (!node?.value) throw new Error(`Unknown color token: ${path}`)
  return node.value
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
}

function resolve(spec, background) {
  const [path, alphaText] = spec.split('@')
  const rgb = hexToRgb(lookup(path))
  if (!alphaText || !background) return rgb
  const alpha = Number(alphaText)
  return rgb.map((c, i) => Math.round(c * alpha + background[i] * (1 - alpha)))
}

function luminance([r, g, b]) {
  const lin = c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const rows = PAIRS.map(pair => {
  const bg = resolve(pair.bg)
  const fg = resolve(pair.fg, bg)
  const value = ratio(fg, bg)
  const need = THRESHOLD[pair.kind]
  return { ...pair, value, need, pass: value >= need }
})

const pad = (s, n) => String(s).padEnd(n)
console.log(`${pad('Foreground', 14)}${pad('Background', 12)}${pad('Kind', 7)}${pad('Ratio', 9)}${pad('Need', 6)}${pad('Result', 8)}Use`)
for (const r of rows) {
  console.log(
    `${pad(r.fg, 14)}${pad(r.bg, 12)}${pad(r.kind, 7)}${pad(r.value.toFixed(2) + ':1', 9)}${pad(r.need + ':1', 6)}${pad(r.pass ? 'pass' : 'FAIL', 8)}${r.use}`,
  )
}

const failed = rows.filter(r => !r.pass)
console.log(`\n${rows.length - failed.length}/${rows.length} pairs pass.`)
if (failed.length) process.exit(1)
