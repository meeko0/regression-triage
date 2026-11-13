/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import tokens from './tokens.json'

// tokens.json is the source of truth. This keeps the @theme block in index.css from drifting.
// Read from disk because Vitest stubs CSS imports.
const css = readFileSync(join(process.cwd(), 'src/index.css'), 'utf8')
const theme = css.slice(css.indexOf('@theme'), css.indexOf('}', css.indexOf('@theme')))

function themeVar(name: string) {
  const match = theme.match(new RegExp(`--${name}:\s*([^;]+);`))
  return match?.[1].trim()
}

function flatten(node: Record<string, unknown>, prefix = ''): [string, string][] {
  return Object.entries(node).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}-${key}` : key
    const v = value as { value?: string }
    return typeof v.value === 'string' ? [[name, v.value] as [string, string]] : flatten(v as Record<string, unknown>, name)
  })
}

describe('design tokens', () => {
  it.each(flatten(tokens.color))('color %s matches @theme', (name, value) => {
    expect(themeVar(`color-${name}`)?.toLowerCase()).toBe(value.toLowerCase())
  })

  it.each(flatten(tokens.font))('font %s matches @theme', (name, value) => {
    expect(themeVar(`font-${name}`)).toBe(value)
  })

  it.each(flatten(tokens.text))('text %s matches @theme', (name, value) => {
    expect(themeVar(`text-${name}`)).toBe(value)
  })
})
