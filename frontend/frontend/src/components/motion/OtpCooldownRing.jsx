import { motion } from 'framer-motion'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

/**
 * Circular countdown ring around Resend OTP cooldown.
 * `progress` is 0→1 (1 = full time remaining).
 */
export default function OtpCooldownRing({
  secondsLeft,
  total = 60,
  label,
  children,
}) {
  const { reduced } = useMotionPrefs()
  const size = 56
  const stroke = 3
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const progress = total > 0 ? Math.min(1, Math.max(0, secondsLeft / total)) : 0
  const offset = c * (1 - progress)

  if (secondsLeft <= 0) {
    return <div className="flex flex-col items-center gap-2">{children}</div>
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative inline-flex h-14 w-14 items-center justify-center">
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(242,238,233,0.12)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-accent-primary)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            animate={{ strokeDashoffset: offset }}
            transition={reduced ? { duration: 0.01 } : { duration: 0.45, ease: 'linear' }}
            style={{
              filter: reduced ? undefined : 'drop-shadow(0 0 6px rgba(255,77,0,0.55))',
            }}
          />
        </svg>
        <motion.span
          className="absolute inset-0 flex items-center justify-center font-display text-lg text-[var(--color-accent-secondary)]"
          animate={reduced ? undefined : { opacity: [0.7, 1, 0.7] }}
          transition={reduced ? undefined : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {secondsLeft}
        </motion.span>
      </div>
      {label && <p className="text-sm text-[var(--color-text-muted)]">{label}</p>}
      {children}
    </div>
  )
}
