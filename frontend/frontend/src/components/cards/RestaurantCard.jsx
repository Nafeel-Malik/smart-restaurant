import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import AnimatedCard from '../motion/AnimatedCard'
import { resolveMediaUrl } from '../../services/customerAuthApi'

export function mediaSrc(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return resolveMediaUrl(path)
}

export default function RestaurantCard({ restaurant, to, actions, staggerChild = false }) {
  if (!restaurant) return null
  const logo = mediaSrc(restaurant.logo)
  const isOpen = restaurant.isOpen ?? restaurant.status === 1

  const body = (
    <AnimatedCard
      staggerChild={staggerChild}
      className="overflow-hidden shadow-sm h-full !p-0"
    >
      <div className="relative h-36 bg-surface-container">
        {logo ? (
          <img src={logo} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <Icon name="storefront" size={40} />
          </div>
        )}
        {actions && <div className="absolute top-3 right-3 z-10">{actions}</div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-on-surface">{restaurant.name || 'Restaurant'}</h3>
          <span
            className={`shrink-0 max-w-[45%] break-words px-2 py-0.5 rounded-full text-[11px] font-bold uppercase leading-tight ${
              isOpen
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant mt-2">
          {restaurant.openingTime || '—'} – {restaurant.closingTime || '—'}
        </p>
        <p className="text-xs text-outline mt-1 flex items-center gap-1">
          <Icon name="star" size={14} filled className="text-secondary" />
          {Number(restaurant.averageRating || 0).toFixed(1)}
          <span>({restaurant.reviewCount || 0})</span>
          <span className="mx-1">·</span>
          {restaurant.currency || 'PKR'}
        </p>
      </div>
    </AnimatedCard>
  )

  if (!to) return body
  return <Link to={to} className="block h-full">{body}</Link>
}
