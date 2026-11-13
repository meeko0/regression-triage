import { useRef, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { shouldClose } from '../lib/sheet'

interface DetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Names the dialog for screen readers, for example the part name. */
  title: string
  children: ReactNode
}

// Bottom sheet for narrow screens. Radix gives it modal behavior (focus trap, Escape, focus return,
// scroll lock). Motion gives it the slide and the drag-to-close gesture. Only the handle bar starts
// a drag, so the content can still scroll by touch.
export function DetailSheet({ open, onOpenChange, title, children }: DetailSheetProps) {
  const controls = useDragControls()
  // The sheet has no Radix trigger (rows open it), so Radix cannot return focus by itself.
  // Remember what had focus when it opened, before Radix moves focus inside, and go back there.
  const returnFocus = useRef<HTMLElement | null>(null)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-primary/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={() => {
                returnFocus.current = document.activeElement as HTMLElement | null
              }}
              onCloseAutoFocus={event => {
                event.preventDefault()
                returnFocus.current?.focus()
              }}
            >
              <motion.div
                data-testid="detail-sheet"
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col border-t-4 border-accent bg-paper"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                drag="y"
                dragControls={controls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.8 }}
                onDragEnd={(_event, info) => {
                  if (shouldClose(info)) onOpenChange(false)
                }}
              >
                <div
                  data-testid="sheet-handle"
                  className="relative flex shrink-0 cursor-grab touch-none items-center justify-between gap-4 px-6 pb-3 pt-2 active:cursor-grabbing"
                  onPointerDown={event => controls.start(event)}
                >
                  <span aria-hidden="true" className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-line" />
                  <Dialog.Title className="label-display mt-4 truncate text-muted">
                    Failure detail<span className="sr-only">: {title}</span>
                  </Dialog.Title>
                  <Dialog.Close className="label-micro mt-4 h-8 shrink-0 border border-primary px-3 text-primary">
                    Close
                  </Dialog.Close>
                </div>
                <div className="min-h-0 overflow-y-auto overscroll-contain">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
