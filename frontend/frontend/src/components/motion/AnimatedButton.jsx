import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

const base =
  'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg px-5 py-2.5 font-display text-[15px] tracking-[0.08em] uppercase select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-secondary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

const variants = {
  primary: {
    className:
      'bg-[var(--color-accent-primary)] text-[var(--color-text)] border border-transparent',
    glow: '0 0 0 rgba(255,77,0,0)',
    glowHover: '0 0 28px var(--color-glow), 0 0 8px rgba(255,77,0,0.55)',
  },
  secondary: {
    className:
      'bg-transparent text-[var(--color-accent-secondary)] border border-[var(--color-accent-secondary)]',
    glow: '0 0 0 rgba(255,182,39,0)',
    glowHover: '0 0 22px rgba(255,182,39,0.35)',
  },
  ghost: {
    className:
      'bg-transparent text-[var(--color-text)] border border-[var(--color-border)]',
    glow: '0 0 0 transparent',
    glowHover: '0 0 16px rgba(242,238,233,0.12)',
  },
  danger: {
    className:
      'bg-[var(--color-danger)] text-[var(--color-text)] border border-transparent',
    glow: '0 0 0 rgba(200,29,37,0)',
    glowHover: '0 0 24px rgba(200,29,37,0.45)',
  },
}

/**
 * Ember-system button with hover glow bloom + tactile tap.
 * Use inside a `.motion-ds` ancestor so CSS variables resolve.
 */
export default function AnimatedButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  const { reduced, hoverScale, tapScale, tween } = useMotionPrefs()
  const [hovered, setHovered] = useState(false)
  const config = variants[variant] || variants.primary
  const isSecondary = variant === 'secondary'

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={
        disabled
          ? undefined
          : {
              scale: hoverScale,
              boxShadow: reduced ? config.glow : config.glowHover,
            }
      }
      whileTap={disabled ? undefined : { scale: tapScale }}
      transition={tween(0.22)}
      className={`${base} ${config.className} ${className}`}
      style={{ boxShadow: config.glow }}
      {...props}
    >
      {isSecondary && !reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,182,39,0.28)] to-transparent"
          animate={{ x: hovered ? '100%' : '-100%' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%' }}
        />
      )}
      <span className="relative z-[1]">{children}</span>
    </motion.button>
  )
}
