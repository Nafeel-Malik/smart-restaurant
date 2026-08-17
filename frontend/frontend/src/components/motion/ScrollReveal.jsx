import { motion } from 'framer-motion'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

const DIRECTIONS = {
  'fade-up': { x: 0, y: 28, scale: 1 },
  'fade-left': { x: 32, y: 0, scale: 1 },
  'fade-right': { x: -32, y: 0, scale: 1 },
  'scale-in': { x: 0, y: 0, scale: 0.92 },
}

/**
 * Generic scroll-into-view reveal. once: true by default.
 */
export default function ScrollReveal({
  children,
  direction = 'fade-up',
  className = '',
  delay = 0,
  amount = 0.2,
  once = true,
  ...props
}) {
  const { reduced, tween } = useMotionPrefs()
  const from = DIRECTIONS[direction] || DIRECTIONS['fade-up']

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        x: reduced ? 0 : from.x,
        y: reduced ? 0 : from.y,
        scale: reduced ? 1 : from.scale,
      }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, amount }}
      transition={{ ...tween(0.5), delay: reduced ? 0 : delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
