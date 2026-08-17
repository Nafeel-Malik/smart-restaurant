import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

/**
 * Floating-label input with accent glow focus + shake on error.
 */
export default function AnimatedInput({
  label,
  id,
  type = 'text',
  value,
  defaultValue,
  error,
  className = '',
  inputClassName = '',
  onFocus,
  onBlur,
  onChange,
  ...props
}) {
  const autoId = useId()
  const inputId = id || autoId
  const { reduced, tween } = useMotionPrefs()
  const [focused, setFocused] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const controlled = value !== undefined
  const [hasValue, setHasValue] = useState(
    Boolean(defaultValue) || (controlled && String(value ?? '').length > 0),
  )

  useEffect(() => {
    if (controlled) setHasValue(String(value ?? '').length > 0)
  }, [controlled, value])

  useEffect(() => {
    if (error) setShakeKey((k) => k + 1)
  }, [error])

  const floated = focused || hasValue
  const borderColor = error
    ? 'var(--color-danger)'
    : focused
      ? 'var(--color-accent-primary)'
      : 'var(--color-border)'
  const glow = error
    ? '0 0 0 3px rgba(200,29,37,0.22)'
    : focused && !reduced
      ? '0 0 0 3px rgba(255,77,0,0.22)'
      : '0 0 0 0 transparent'

  return (
    <div className={`relative ${className}`}>
      <motion.div
        key={error ? `shake-${shakeKey}` : 'stable'}
        className={error && !reduced ? 'motion-input-shake' : undefined}
        animate={{ borderColor, boxShadow: glow }}
        transition={tween(0.28)}
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 12,
          background: 'var(--color-surface-elevated)',
        }}
      >
        {label && (
          <motion.label
            htmlFor={inputId}
            className="pointer-events-none absolute left-3 origin-left font-[family-name:var(--font-body)] text-[var(--color-text-muted)]"
            initial={false}
            animate={{
              y: floated ? 8 : 18,
              scale: floated ? 0.78 : 1,
              color: error
                ? 'var(--color-danger)'
                : focused
                  ? 'var(--color-accent-primary)'
                  : 'var(--color-text-muted)',
            }}
            transition={tween(0.22)}
          >
            {label}
          </motion.label>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          defaultValue={defaultValue}
          className={`w-full bg-transparent px-3 pb-3 pt-6 text-[var(--color-text)] outline-none placeholder:text-transparent ${inputClassName}`}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            setHasValue(String(e.target.value || '').length > 0)
            onBlur?.(e)
          }}
          onChange={(e) => {
            setHasValue(String(e.target.value || '').length > 0)
            onChange?.(e)
          }}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </motion.div>
      <AnimatePresence>
        {error ? (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={tween(0.2)}
            className="mt-1.5 text-xs text-[var(--color-danger)]"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
