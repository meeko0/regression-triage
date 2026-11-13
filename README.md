# Regression triage

A portfolio prototype for the task: "An engineer checks last night's regression run and decides which failures block the next design release."

All data is mock. Part names, assemblies, and run IDs are invented, and nothing comes from a real vehicle program or internal system.

## Run it

```bash
npm install
npm run dev              # local dev server
npm test                 # unit and component tests (Vitest + Testing Library)
npm run build            # type-check and production build
E2E_CHROME_PATH=/path/to/chrome npm run test:e2e   # Playwright (omit the variable if Playwright's own Chromium is installed)
```

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4 with tokens mirrored from `src/styles/tokens.json`
- TanStack Query for server state, with an optimistic status update and rollback
- Zustand for UI state (filters, sort, selection)
- Motion for list, bar, and panel animation
- Vitest, Testing Library, and Playwright

## Structure

- `src/api/`: mock API and query hooks
- `src/data/`: seeded mock data generator
- `src/lib/triage.ts`: pure filter, sort, and summary functions (unit tested)
- `src/store/`: Zustand store
- `src/components/`: header, filters, index list, risk bar, detail panel
- `e2e/`: Playwright smoke tests

## Controls

- Click a row, or use the arrow keys or J and K, to move through the list.
- "Blocking only" shows high-risk failures that aren't resolved.

## Design notes

Brand colors are navy `#111184` (primary) and olive `#848411` (accent). Run `npm run contrast` to check every text and background pair.

**Surface: paper background, navy type, olive accents.** This is a reading tool. An engineer scans 48 rows, compares risk bars, and reads suggested actions, so the bulk of the screen has to be comfortable for small text. Navy on paper is 13.55:1, and the three risk colors all pass 4.5:1 on paper, so they can label text, not just fill bars. A navy background would put the risk colors and olive on a dark surface where they lose contrast (olive on navy is under 4.5:1), and it would make the dense list heavier to read. Olive measures 3.68:1 on paper, so it only appears at display size ("triage." in the header), as fills (the rule under the header), and as the focus ring. On navy surfaces, such as the selected row, a lighter olive (`accent-soft`, 9.34:1) takes its place.

## Not yet built

- Storybook for the component library
- Real API and auth
- Style Dictionary to generate CSS from `tokens.json` automatically
- A bottom sheet for the detail panel on mobile (currently it scrolls into view below the list)
