import * as Dialog from '@radix-ui/react-dialog'
import { Button } from './ui/Button'

// Built from README.md at build time by scripts/readme-page.ts.
export const README_ABOUT_URL = './readme.html#what-this-is'

// Radix Dialog traps focus while open, closes on Escape, and returns focus to the trigger.
export function AboutDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="label-micro text-primary underline decoration-accent decoration-2 underline-offset-4 hover:decoration-primary"
        >
          About this prototype
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-primary/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-6 overflow-y-auto border border-primary bg-paper p-8 shadow-[8px_8px_0_0_var(--color-accent)]">
          <div className="flex items-start justify-between gap-6">
            <Dialog.Title className="font-display text-display-sm font-bold">About this prototype</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="outline" className="h-8 px-3" aria-label="Close about panel">
                Close
              </Button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-body-lg">
            A triage view for a nightly regression run. It ranks failures by risk and flags the ones that block the next
            design release, so an engineer can decide what to fix first.
          </Dialog.Description>

          <div className="flex flex-col gap-3 text-body">
            <p>
              You can filter by error type and status, read a suggested next step, and move a failure to investigating or
              resolved. The view is kept in the URL, so you can share a filtered list.
            </p>
            <p className="border-l-4 border-accent pl-4">
              All data is mock. Parts, assemblies, engineers, and run IDs are invented. Nothing comes from a real vehicle
              program or internal system.
            </p>
          </div>

          <a
            href={README_ABOUT_URL}
            className="self-start text-body-sm font-medium underline decoration-accent decoration-2 underline-offset-4 hover:decoration-primary"
          >
            Read the full description in the README
          </a>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
