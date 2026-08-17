import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useMotionPrefs } from '../../motion/useMotionPrefs'
import AnimatedButton from './AnimatedButton'

/**
 * Springy modal with fading backdrop. AnimatePresence required for exit.
 */
export default function AnimatedModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) {
  const { reduced, spring, tween } = useMotionPrefs()
  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 motion-ds">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tween(0.22)}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'animated-modal-title' : undefined}
            initial={{ opacity: 0, scale: reduced ? 1 : 0.95, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.96, y: reduced ? 0 : 8 }}
            transition={spring}
            className={`relative z-[1] flex max-h-[92vh] w-full flex-col ${widths[size]} overflow-hidden rounded-t-2xl sm:rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_40px_rgba(255,77,0,0.12)]`}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              {title ? (
                <h3
                  id="animated-modal-title"
                  className="font-display text-[clamp(1.125rem,2.5vw+0.75rem,1.5rem)] tracking-[0.06em] text-[var(--color-text)]"
                >
                  {title}
                </h3>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-2.5 py-1 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-secondary)]"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 text-[var(--color-text)] sm:px-5">{children}</div>
            <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-4 sm:px-5">
              {footer || (
                <AnimatedButton variant="ghost" onClick={onClose}>
                  Close
                </AnimatedButton>
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
