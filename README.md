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

Visual direction is taken from cotton.design/work: black and off-white, large type, a filterable index, and short confident copy. I couldn't read that page's CSS, so the specific values in `tokens.json` are my own choices, not measurements from their site.

## Not yet built

- Storybook for the component library
- Real API and auth
- Style Dictionary to generate CSS from `tokens.json` automatically
- A bottom sheet for the detail panel on mobile (currently it scrolls into view below the list)
