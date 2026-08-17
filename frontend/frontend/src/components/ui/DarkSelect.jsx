import { useId, useState } from 'react'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

/**
 * Dark-themed native select for staff/motion-ds surfaces.
 * Hides the browser arrow and uses a themed chevron + AnimatedInput-style focus glow.
 */
export default function DarkSelect({
  label,
  id,
  error,
  icon,
  compact = false,
  toneClassName = '',
  className = '',
  selectClassName = '',
  children,
  ...props
}) {
  const autoId = useId()
  const selectId = id || autoId
  const { reduced, tween } = useMotionPrefs()
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? 'var(--color-danger)'
    : focused
      ? 'var(--color-accent-primary)'
      : undefined
  const glow = error
    ? '0 0 0 3px rgba(200,29,37,0.22)'
    : focused && !reduced
      ? '0 0 0 3px rgba(255,77,0,0.22)'
      : '0 0 0 0 transparent'

  const padding = compact ? 'py-1.5 pl-3 pr-8' : icon ? 'py-3 pl-10 pr-10' : 'py-3 pl-3 pr-10'
  const textSize = compact ? 'text-sm capitalize' : 'text-[var(--color-text)]'

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block font-label-lg text-label-lg text-on-surface-variant">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--color-text-muted)]">
            <Icon name={icon} size={20} />
          </div>
        )}
        <motion.select
          id={selectId}
          {...props}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          animate={{
            borderColor: borderColor || 'var(--color-border)',
            boxShadow: glow,
          }}
          transition={tween(0.28)}
          className={`motion-dark-select w-full appearance-none rounded-xl border outline-none transition-colors ${padding} ${textSize} ${
            toneClassName ||
            'border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-text)]'
          } ${selectClassName}`}
          style={{ borderWidth: 1, borderStyle: 'solid' }}
          aria-invalid={Boolean(error)}
        >
          {children}
        </motion.select>
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 flex items-center text-[var(--color-text-muted)] ${compact ? 'pr-2' : 'pr-3'}`}
          aria-hidden
        >
          <Icon name="expand_more" size={compact ? 18 : 20} />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  )
}
