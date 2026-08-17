import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import HeatRipple from '../components/motion/HeatRipple'
import { AuthFocusProvider } from '../motion/authFocusContext'
import { useMotionPrefs } from '../motion/useMotionPrefs'

/**
 * Charcoal/ember auth shell for Superadmin + Branch Manager logins.
 * Same HeatRipple fill stacking as CustomerAuthLayout (fixed glow behind, form on top).
 *
 * @param {'admin' | 'manager'} portal
 */
export default function StaffAuthLayout({ portal = 'admin' }) {
  const location = useLocation()
  const { reduced, pageDuration } = useMotionPrefs()
  const brandTo = portal === 'manager' ? '/branch-login' : '/login'
  const aria = portal === 'manager' ? 'RestoPro — Manager login' : 'RestoPro — Admin login'

  return (
    <MotionConfig reducedMotion="user">
      <AuthFocusProvider>
        <div className="motion-ds relative isolate min-h-screen overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
          <HeatRipple fill intensity={0.48} aria-hidden />

          <div className="relative z-20 flex min-h-screen flex-col px-4 py-8 sm:px-6 sm:py-10">
            <Link
              to={brandTo}
              className="mb-6 inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1.5 text-[var(--color-text)] transition-colors hover:text-[var(--color-accent-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-secondary)]"
              aria-label={aria}
            >
              <span className="font-display text-2xl tracking-[0.12em] text-[var(--color-accent-primary)]">
                RestoPro
              </span>
            </Link>

            <div className="flex flex-1 items-center justify-center pb-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  className="w-full max-w-[480px]"
                  initial={{ opacity: 0, y: reduced ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduced ? 0 : -10 }}
                  transition={{
                    duration: Math.max(pageDuration, 0.2),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </AuthFocusProvider>
    </MotionConfig>
  )
}
