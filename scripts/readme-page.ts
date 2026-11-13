import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Marked } from 'marked'
import type { Plugin } from 'vite'
import tokens from '../src/styles/tokens.json' with { type: 'json' }

// Renders README.md to readme.html so the in-app "About" panel can link to a section of it
// (for example readme.html#what-this-is) without a network request or a public repo URL.

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function renderReadme(root: string) {
  const markdown = readFileSync(join(root, 'README.md'), 'utf8')
  const marked = new Marked({
    renderer: {
      heading({ tokens: inline, depth }) {
        const text = this.parser.parseInline(inline)
        return `<h${depth} id="${slugify(text)}">${text}</h${depth}>\n`
      },
    },
  })
  // Images in the README point at docs/, which is not part of the build. Drop them from the page.
  const body = (marked.parse(markdown.replace(/!\[[^\]]*\]\([^)]*\)\n?/g, '')) as string)
  const c = tokens.color

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>README: Regression triage</title>
<style>
  body { margin: 0; background: ${c.paper.value}; color: ${c.primary.value}; font: 16px/1.6 ${tokens.font.sans.value}; }
  main { max-width: 46rem; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
  h1, h2, h3 { line-height: 1.2; margin-top: 2.5rem; }
  h1 { font-size: 2.25rem; border-bottom: 4px solid ${c.accent.value}; padding-bottom: 1rem; }
  a { color: ${c.primary.value}; }
  :focus-visible { outline: 3px solid ${c.accent.value}; outline-offset: 2px; }
  code { background: ${c.line.value}; padding: 0.1em 0.3em; font-size: 0.9em; }
  pre { background: ${c.primary.value}; color: ${c.paper.value}; padding: 1rem; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
  th, td { border-bottom: 1px solid ${c.line.value}; padding: 0.4rem 0.5rem; text-align: left; }
  .back { font-size: 0.875rem; }
</style>
</head>
<body>
<main>
<p class="back"><a href="./">Back to the prototype</a></p>
${body}
</main>
</body>
</html>
`
}

export function readmePage(): Plugin {
  let root = process.cwd()
  return {
    name: 'readme-page',
    configResolved(config) {
      root = config.root
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.split('?')[0].endsWith('/readme.html')) return next()
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(renderReadme(root))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'readme.html', source: renderReadme(root) })
    },
  }
}
