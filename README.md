# Regression triage

A portfolio prototype for one task: an engineer checks last night's regression run and decides which failures block the next design release.

## What this is

Every night, an automated regression run checks a vehicle design model for problems: parts that collide, constraints that broke, mass over budget, links to outdated parts. A run can produce dozens of failures. Most are noise or already known. A few block the next design release, and someone has to find them before the morning review.

This prototype is for the design engineer who does that first pass. Version 1 ranks failures by risk, filters them by error type and status, and flags the ones that block a release. It shows a suggested next step for each one and lets the engineer move it to investigating or resolved. Status changes save at once and roll back if the server rejects them.

Out of scope on purpose: real authentication, a real API, editing the design model, and notifications. **All data is mock.** Part names, assemblies, engineers, and run IDs are invented, and nothing comes from a real vehicle program or internal system.

## Why it's built this way

- **Pure functions for triage logic.** Filtering, sorting, and the "blocking" rule live in `src/lib/triage.ts` with no React, so they are easy to test and reuse.
- **Server state and UI state are separate.** TanStack Query owns the failure data. Zustand owns what the user is looking at. Neither one copies the other.
- **Optimistic updates with rollback.** A status change shows at once, because waiting on a slow nightly-run service would break the flow of triage.
- **Seeded mock data.** The same seed always gives the same run, so tests and screenshots are stable.
- **Tokens as the source of truth.** Colors, fonts, and the type scale live in `tokens.json`, with a test that keeps the CSS in sync and a script that checks contrast.
- **Keyboard first.** Engineers triage dozens of rows, so J, K, and the arrow keys move through the list.

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
