// Launches Vitest from a working directory with an uppercase drive letter.
//
// Some Windows terminals (VS Code among them) report the working directory as "c:\...".
// Vitest then loads its runner under two path spellings, and every suite fails with
// "Vitest failed to find the current suite". Starting the child process from "C:\..." fixes it.
import { spawn } from 'node:child_process'
import { join } from 'node:path'

const cwd = process.platform === 'win32' ? process.cwd().replace(/^[a-z]:/, d => d.toUpperCase()) : process.cwd()
const bin = join(cwd, 'node_modules', 'vitest', 'vitest.mjs')

const child = spawn(process.execPath, [bin, ...process.argv.slice(2)], { cwd, stdio: 'inherit' })
child.on('exit', code => process.exit(code ?? 1))
