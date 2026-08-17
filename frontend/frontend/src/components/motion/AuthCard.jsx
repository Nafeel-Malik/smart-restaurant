import { Children } from 'react'
import { motion } from 'framer-motion'
import Icon from '../ui/Icon'
import { useAuthCardFocus } from '../../motion/authFocusContext'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

/**
 * Dark smoke auth card with ember border that intensifies when a field is focused.
 */
export default function AuthCard({
  eyebrow,
  title,
  subtitle,
  icon = 'person',
  portalLabel = 'Customer portal',
  children,
  footer,
}) {
  const { setFocused } = useAuthCardFocus()
  const { reduced, spring, tween } = useMotionPrefs()
  const { focused } = useAuthCardFocus()

  return (
    <div className="w-full">
      <motion.div
        className="mb-8 flex flex-col items-center text-center"
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
      >
        <motion.div
          className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-primary)] text-[var(--color-text)]"
          initial={reduced ? false : { scale: 0.85, boxShadow: '0 0 0 rgba(255,77,0,0)' }}
          animate={
            reduced
              ? { scale: 1, boxShadow: '0 0 20px rgba(255,77,0,0.35)' }
              : {
                  scale: 1,
                  boxShadow: [
                    '0 0 12px rgba(255,77,0,0.25)',
                    '0 0 36px rgba(255,77,0,0.55)',
                    '0 0 20px rgba(255,77,0,0.35)',
                  ],
                }
          }
          transition={
            reduced
              ? { duration: 0.01 }
              : { duration: 1.15, times: [0, 0.45, 1], ease: [0.22, 1, 0.36, 1] }
          }
        >
          <Icon name={icon} size={32} />
        </motion.div>
        <h1 className="font-display text-4xl tracking-[0.1em] text-[var(--color-text)] sm:text-5xl">
          RestoPro
        </h1>
        <p className="mt-1 text-sm uppercase tracking-[0.18em] text-[var(--color-accent-secondary)]">
          {portalLabel}
        </p>
      </motion.div>

      <motion.div
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
        }}
        animate={{
          borderColor: focused ? 'rgba(255,77,0,0.55)' : 'rgba(242,238,233,0.12)',
          boxShadow: focused
            ? '0 0 0 1px rgba(255,77,0,0.35), 0 24px 60px rgba(0,0,0,0.55), 0 0 48px rgba(255,77,0,0.22)'
            : '0 0 0 1px rgba(242,238,233,0.08), 0 20px 50px rgba(0,0,0,0.45), 0 0 24px rgba(255,77,0,0.08)',
        }}
        transition={tween(0.35)}
        className="rounded-2xl border bg-[var(--color-surface)] p-6 sm:p-8"
        style={{ borderWidth: 1 }}
      >
        <div className="mb-5">
          {eyebrow && (
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-secondary)]">
              {eyebrow}
            </span>
          )}
          <h2 className="font-display text-3xl tracking-[0.06em] text-[var(--color-text)]">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
          )}
        </div>

        {children}

        {footer && (
          <div className="mt-6 border-t border-[var(--color-border)] pt-5 text-center text-sm text-[var(--color-text-muted)]">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  )
}

/** Staggers direct children without parent-variant opacity traps.
 * Each child gets its own animate→visible so fields never stick at opacity: 0
 * when nested under AnimatePresence / MotionConfig.
 */
export function AuthStagger({ children, className = '', as = 'div', ...props }) {
  const { reduced, tween } = useMotionPrefs()
  const items = Children.toArray(children).filter(Boolean)

  const staggered = items.map((child, index) => (
    <motion.div
      key={child.key ?? index}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...tween(0.4),
        delay: reduced ? 0 : 0.05 + index * 0.055,
      }}
    >
      {child}
    </motion.div>
  ))

  if (as === 'form') {
    return (
      <form className={className} {...props}>
        {staggered}
      </form>
    )
  }

  return (
    <div className={className} {...props}>
      {staggered}
    </div>
  )
}
