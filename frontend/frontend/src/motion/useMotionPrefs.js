import { useReducedMotion } from 'framer-motion'

/**
 * Central motion prefs for the charcoal/ember design system.
 * When prefers-reduced-motion is on: no scale/glow/travel — opacity/color only.
 */
export function useMotionPrefs() {
  const reduced = useReducedMotion()
  return {
    reduced: Boolean(reduced),
    duration: reduced ? 0.01 : 0.28,
    pageDuration: reduced ? 0.01 : 0.26,
    hoverScale: reduced ? 1 : 1.03,
    tapScale: reduced ? 1 : 0.96,
    liftY: reduced ? 0 : -4,
    enterY: reduced ? 0 : 20,
    spring: reduced
      ? { type: 'tween', duration: 0.01 }
      : { type: 'spring', stiffness: 420, damping: 28, mass: 0.8 },
    tween: (duration = 0.28) =>
      reduced ? { duration: 0.01 } : { duration, ease: [0.22, 1, 0.36, 1] },
  }
}

export const staggerContainer = (reduced, stagger = 0.06) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: reduced ? 0 : stagger,
      delayChildren: reduced ? 0 : 0.04,
    },
  },
})

export const staggerItem = (reduced, enterY = 20) => ({
  hidden: { opacity: 0, y: reduced ? 0 : enterY },
  show: {
    opacity: 1,
    y: 0,
    transition: reduced
      ? { duration: 0.01 }
      : { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
})
