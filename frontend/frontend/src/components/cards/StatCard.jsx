import { motion } from 'framer-motion'
import Icon from '../ui/Icon'

import { STAT_LABEL } from '../../constants/breakpoints'

export default function StatCard({
  label,
  value,
  unit,
  badge,
  badgeTone = 'success',
  note,
  progress,
  progressColor = 'bg-primary',
  icon,
  accent,
  children,
  className = '',
}) {
  const badgeStyles = {
    success: 'bg-secondary-container text-on-secondary-container',
    error: 'text-error',
    muted: 'text-outline',
    warning: 'text-error font-bold',
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`bg-surface border border-outline-variant rounded-xl p-5 hover:shadow-lg transition-shadow duration-300 ${accent || ''} ${className}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className={`${STAT_LABEL} flex min-w-0 flex-1 items-start gap-2`}>
          {icon && <Icon name={icon} className="mt-0.5 shrink-0 text-[18px]" />}
          <span className="min-w-0">{label}</span>
        </p>
        {badge && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeStyles[badgeTone] || badgeStyles.success}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-numeral-lg text-numeral-lg text-primary font-bold">{value}</span>
        {unit && <span className="font-label-md text-label-md text-outline">{unit}</span>}
      </div>
      {note && <p className="mt-2 text-[10px] text-on-surface-variant">{note}</p>}
      {progress !== undefined && (
        <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
          <div className={`h-full ${progressColor}`} style={{ width: progress }} />
        </div>
      )}
      {children}
    </motion.div>
  )
}
