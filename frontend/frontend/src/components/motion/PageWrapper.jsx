import { motion } from 'framer-motion'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

/**
 * Route-level page entrance — snappy fade + slight rise.
 * Pair with AnimatePresence + key={pathname} at the layout outlet.
 */
export default function PageWrapper({ children, className = '' }) {
  const { reduced, enterY, pageDuration } = useMotionPrefs()

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : Math.min(enterY, 14) }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -8 }}
      transition={{
        duration: pageDuration,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
