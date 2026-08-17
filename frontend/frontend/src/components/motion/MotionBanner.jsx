import { AnimatePresence, motion } from 'framer-motion'
import Icon from '../ui/Icon'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

/** Springy success/error banner — error variant adds horizontal shake. */
export default function MotionBanner({ type = 'error', children, className = '', shake = false }) {
  const { reduced, spring } = useMotionPrefs()
  if (!children) return null

  const styles =
    type === 'success'
      ? 'bg-secondary-container text-on-secondary-container border border-[rgba(255,182,39,0.25)]'
      : 'bg-error-container text-on-error-container border border-[rgba(200,29,37,0.45)]'

  const shouldShake = (shake || type === 'error') && !reduced

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={String(children)}
        role="status"
        initial={{ opacity: 0, y: reduced ? 0 : -12, scale: reduced ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduced ? 0 : -8 }}
        transition={spring}
        className={`p-4 rounded-lg text-sm flex items-start gap-2 ${styles} ${shouldShake ? 'motion-input-shake' : ''} ${className}`}
      >
        <Icon name={type === 'success' ? 'check_circle' : 'error'} size={16} className="mt-0.5 shrink-0" />
        <span className="min-w-0">{children}</span>
      </motion.div>
    </AnimatePresence>
  )
}
