// Runs a package binary from a working directory with an uppercase drive letter.
//   node scripts/run.mjs <package> [args...]     for example: node scripts/run.mjs vitest run
//
// Some Windows terminals (VS Code among them) report the working directory as "c:\...", while Node
// resolves files to "C:\...". Tools that compare the two break in odd ways:
//   - Vitest loads its runner twice and every suite fails with "failed to find the current suite".
//   - Storybook cannot make story paths relative, so every story fails to load ("importFn is not a function").
// Starting the tool from "C:\..." avoids both. On other platforms this is a plain passthrough.
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const [pkg, ...args] = process.argv.slice(2)
if (!pkg) {
  console.error('Usage: node scripts/run.mjs <package> [args...]')
  process.exit(2)
}

const cwd = process.platform === 'win32' ? process.cwd().replace(/^[a-z]:/, d => d.toUpperCase()) : process.cwd()
const pkgDir = join(cwd, 'node_modules', pkg)
const { bin } = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
const binPath = join(pkgDir, typeof bin === 'string' ? bin : (bin[pkg] ?? Object.values(bin)[0]))

const child = spawn(process.execPath, [binPath, ...args], { cwd, stdio: 'inherit' })
child.on('exit', code => process.exit(code ?? 1))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
