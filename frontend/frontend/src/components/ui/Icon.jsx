import { ICON_MAP } from './iconMap'

/**
 * SVG icon wrapper — replaces Material Symbols ligatures (no font-load flash).
 * @param {string} name — legacy Material icon name (e.g. "person", "storefront")
 * @param {boolean} [filled] — for star/heart, uses currentColor fill when true
 */
export default function Icon({ name, filled = false, className = '', size = 24, strokeWidth, ...props }) {
  const LucideIcon = ICON_MAP[name]

  if (!LucideIcon) {
    if (import.meta.env.DEV) {
      console.warn(`[Icon] Unknown icon name: "${name}"`)
    }
    return null
  }

  const resolvedSize = typeof size === 'number' ? size : 24
  const fillStyle = filled ? 'currentColor' : 'none'

  return (
    <LucideIcon
      size={resolvedSize}
      strokeWidth={strokeWidth ?? (filled ? 0 : 2)}
      fill={fillStyle}
      className={`inline-block shrink-0 ${className}`}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    />
  )
}
