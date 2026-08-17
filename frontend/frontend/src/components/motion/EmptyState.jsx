import { motion } from 'framer-motion'
import Icon from '../ui/Icon'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

/** Designed empty state with a gently pulsing icon. */
export default function EmptyState({ icon = 'inbox', title, hint, action, className = '' }) {
  const { reduced } = useMotionPrefs()

  return (
    <div
      className={`p-10 text-center bg-surface border border-outline-variant rounded-xl ${className}`}
    >
      <motion.div
        className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"
        animate={reduced ? undefined : { scale: [1, 1.06, 1], opacity: [0.75, 1, 0.75] }}
        transition={reduced ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon name={icon} size={28} />
      </motion.div>
      {title && <h2 className="font-headline-sm font-semibold mb-2">{title}</h2>}
      {hint && <p className="text-on-surface-variant mb-4">{hint}</p>}
      {action}
    </div>
  )
}
