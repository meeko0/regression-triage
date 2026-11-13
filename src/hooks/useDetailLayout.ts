import { useMediaQuery } from './useMediaQuery'

/**
 * How the detail panel is shown:
 *   side   : 1024px and wider, a sticky panel next to the list
 *   sheet  : narrower, a bottom sheet that can be dragged closed
 *   inline : narrower with reduced motion, the panel sits below the list and the page scrolls to it
 */
export type DetailLayout = 'side' | 'sheet' | 'inline'

export const NARROW_QUERY = '(max-width: 1023px)'
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function useDetailLayout(): { layout: DetailLayout; reveal: () => void } {
  const narrow = useMediaQuery(NARROW_QUERY)
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY)
  const layout: DetailLayout = !narrow ? 'side' : reduced ? 'inline' : 'sheet'

  // Fallback for the inline layout: bring the panel into view after a tap. No smooth scroll,
  // since this layout is only used when the user asked for reduced motion.
  const reveal = () => {
    if (layout === 'inline') document.getElementById('failure-detail')?.scrollIntoView({ block: 'start' })
  }

  return { layout, reveal }
}
