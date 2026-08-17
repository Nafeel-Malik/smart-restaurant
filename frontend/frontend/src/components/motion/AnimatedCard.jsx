import { motion } from 'framer-motion'
import { useMotionPrefs, staggerContainer, staggerItem } from '../../motion/useMotionPrefs'

/**
 * Viewport-aware card with heat-lift hover + optional stagger via AnimatedCardGrid.
 */
export default function AnimatedCard({
  children,
  className = '',
  staggerChild = false,
  ...props
}) {
  const { reduced, liftY, enterY, tween } = useMotionPrefs()

  const sharedClass = [
    'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]',
    'text-[var(--color-text)] transition-[border-color,box-shadow] duration-300',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const hover = reduced
    ? { borderColor: 'rgba(255,77,0,0.35)' }
    : {
        y: liftY,
        borderColor: 'rgba(255,77,0,0.45)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45), 0 0 24px rgba(255,77,0,0.18)',
      }

  if (staggerChild) {
    return (
      <motion.div
        variants={staggerItem(reduced, enterY)}
        whileHover={hover}
        transition={tween(0.25)}
        className={sharedClass}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: enterY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={hover}
      transition={tween(0.45)}
      className={sharedClass}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Parent for staggered card grids — wrap AnimatedCard with staggerChild. */
export function AnimatedCardGrid({ children, className = '', stagger = 0.065, ...props }) {
  const { reduced } = useMotionPrefs()
  return (
    <motion.div
      className={className}
      variants={staggerContainer(reduced, stagger)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
