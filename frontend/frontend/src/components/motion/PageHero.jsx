import HeatRipple from './HeatRipple'

/** Page title band with optional cursor heat ripple. */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  actions,
  heat = true,
  className = '',
}) {
  const inner = (
    <div className={`flex items-start justify-between gap-4 flex-wrap ${className}`}>
      <div className="min-w-0">
        {eyebrow}
        {typeof title === 'string' ? (
          <h1 className="font-display text-[clamp(1.75rem,4vw+1rem,3rem)] leading-none tracking-[0.04em] text-primary">
            {title}
          </h1>
        ) : (
          title
        )}
        {subtitle && <div className="mt-2 text-on-surface-variant">{subtitle}</div>}
      </div>
      {actions}
    </div>
  )

  if (!heat) return <header className="mb-2">{inner}</header>

  return (
    <HeatRipple className="rounded-2xl border border-outline-variant mb-2" intensity={0.32}>
      <div className="p-4 sm:p-5 md:p-6">{inner}</div>
    </HeatRipple>
  )
}
