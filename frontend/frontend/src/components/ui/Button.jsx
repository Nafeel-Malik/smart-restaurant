import { motion } from 'framer-motion'

const variants = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container shadow-md',
  secondary:
    'bg-transparent border border-primary text-primary hover:bg-primary/5',
  outline:
    'bg-transparent border border-outline-variant text-on-surface-variant hover:bg-surface-container',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container',
  danger: 'bg-error text-on-error hover:opacity-90',
  soft: 'bg-surface-container-low text-on-surface hover:bg-surface-container',
}

const sizes = {
  sm: 'px-3 py-1.5 text-label-md',
  md: 'px-4 py-2 text-label-lg',
  lg: 'px-6 py-2.5 text-label-lg',
  xl: 'px-6 py-4 text-label-lg',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  rounded = 'lg',
  type = 'button',
  disabled = false,
  onClick,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-label-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed rounded-${rounded} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}
