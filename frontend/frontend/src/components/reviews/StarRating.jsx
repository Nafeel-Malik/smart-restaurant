import { useState } from 'react'
import { motion } from 'framer-motion'
import Icon from '../ui/Icon'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

export default function StarRating({ value = 0, onChange, size = 22, readOnly = false }) {
  const rating = Number(value) || 0
  const [hover, setHover] = useState(0)
  const { reduced, tween } = useMotionPrefs()
  const display = hover || rating

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`${rating} out of 5 stars`}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= display
        if (readOnly) {
          return (
            <motion.span
              key={star}
              initial={false}
              animate={{ scale: active && !reduced ? 1 : 1, opacity: active ? 1 : 0.45 }}
              transition={{ ...tween(0.2), delay: reduced ? 0 : star * 0.04 }}
              className={active ? 'text-secondary' : 'text-outline-variant'}
            >
              <Icon name="star" size={size} filled={active} />
            </motion.span>
          )
        }
        return (
          <motion.button
            key={star}
            type="button"
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHover(star)}
            whileHover={reduced ? undefined : { scale: 1.15 }}
            whileTap={reduced ? undefined : { scale: 0.9 }}
            animate={{
              scale: active && !reduced ? 1.05 : 1,
              color: active ? '#ffb627' : '#6e655c',
            }}
            transition={{ ...tween(0.18), delay: reduced ? 0 : (active ? star * 0.035 : 0) }}
            className="p-0.5"
          >
            <Icon name="star" size={size} filled={active} />
          </motion.button>
        )
      })}
    </div>
  )
}
