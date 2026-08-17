import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from '../ui/Icon'

const statusStyles = {
  Active: 'bg-secondary-container text-on-secondary-container',
  Inactive: 'bg-error-container text-on-error-container',
  Pending: 'bg-surface-container-highest text-outline',
  'On Duty': 'bg-secondary-container text-on-secondary-container',
  'Off Duty': 'bg-surface-container-highest text-outline',
  Scheduled: 'bg-primary-fixed text-on-primary-fixed-variant',
  'Off Site': 'bg-surface-container-highest text-outline',
  Overtime: 'bg-error-container text-on-error-container',
  Break: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  Offline: 'bg-surface-container-highest text-outline',
  Occupied: 'bg-error-container text-on-error-container',
  Available: 'bg-secondary-container text-on-secondary-container',
  Reserved: 'bg-primary-fixed text-on-primary-fixed-variant',
  'On Hold': 'bg-surface-container-highest text-outline',
  Draft: 'bg-surface-container-highest text-outline',
  Review: 'bg-primary-fixed text-on-primary-fixed-variant',
  'In Stock': 'bg-secondary-container text-on-secondary-container',
  'Out of Stock': 'bg-error-container text-on-error-container',
}

export function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={`inline-block max-w-full break-words px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusStyles[status] || statusStyles.Pending} ${className}`}
    >
      {status}
    </span>
  )
}

export default StatusBadge

export function SearchBar({ placeholder = 'Search...', value, onChange, className = '' }) {
  return (
    <div
      className={`hidden md:flex items-center bg-surface-container-low border border-outline-variant rounded-full px-4 py-1.5 w-64 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all ${className}`}
    >
      <Icon name="search" className="text-outline mr-2 text-sm" size={18} />
      <input
        className="bg-transparent border-none text-body-md focus:ring-0 w-full placeholder:text-outline-variant outline-none"
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

export function Pagination({
  summary = 'Showing 1-10 of 24',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  if (!totalPages || totalPages < 1) return null

  const windowSize = 5
  let start = Math.max(1, currentPage - Math.floor(windowSize / 2))
  let end = Math.min(totalPages, start + windowSize - 1)
  start = Math.max(1, end - windowSize + 1)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-gutter py-4 border-t border-outline-variant">
      <p className="font-body-md text-body-md text-on-surface-variant">{summary}</p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
        >
          <Icon name="chevron_left" />
        </button>
        {start > 1 && <span className="px-2 text-outline">…</span>}
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange?.(page)}
            className={`w-9 h-9 rounded-lg font-label-md text-sm transition-colors ${
              page === currentPage
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {page}
          </button>
        ))}
        {end < totalPages && <span className="px-2 text-outline">…</span>}
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
        >
          <Icon name="chevron_right" />
        </button>
      </div>
    </div>
  )
}

export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex items-center gap-2 text-body-md text-on-surface-variant mb-stack-md flex-wrap">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {index > 0 && <Icon name="chevron_right" className="text-sm text-outline" size={16} />}
          {item.to ? (
            <Link to={item.to} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'text-primary font-semibold' : ''}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function PageHeader({ title, subtitle, actions, hideActionsBelowSm = false, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-stack-lg ${className}`}>
      <div className="min-w-0">
        <h1 className="font-headline-md text-headline-md text-primary font-semibold text-display-hero sm:text-headline-md">{title}</h1>
        {subtitle && <p className="font-body-md text-body-md text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className={`flex shrink-0 items-center gap-3 flex-wrap ${hideActionsBelowSm ? 'max-sm:hidden' : ''}`}>
          {actions}
        </div>
      )}
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <Icon name={icon} className="text-outline-variant text-5xl mb-4" size={48} />
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">{title}</h3>
      {description && <p className="font-body-md text-body-md text-on-surface-variant max-w-md">{description}</p>}
    </motion.div>
  )
}
