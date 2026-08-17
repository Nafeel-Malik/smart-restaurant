import Icon from '../ui/Icon'
import AnimatedCard from '../motion/AnimatedCard'
import { mediaSrc } from './RestaurantCard'

/**
 * Menu/food card — image area + caption below (matches RestaurantCard pattern).
 * No title/category text overlaid on the image.
 */
export default function MenuItemCard({
  name,
  priceDisplay,
  categoryName,
  image,
  staggerChild = false,
  className = '',
  imageOverlay = null,
  footer = null,
  children = null,
}) {
  const src = mediaSrc(image)

  return (
    <AnimatedCard
      staggerChild={staggerChild}
      className={`overflow-hidden shadow-sm !p-0 flex flex-col h-full ${className}`}
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-[var(--color-surface-container)]">
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
            <Icon name="restaurant" size={40} aria-hidden />
          </div>
        )}
        {imageOverlay ? <div className="absolute top-3 right-3 z-10">{imageOverlay}</div> : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {categoryName ? (
          <span className="mb-2 inline-flex w-fit rounded-full bg-[var(--color-surface-container-high)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-accent-secondary)]">
            {categoryName}
          </span>
        ) : null}

        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-[var(--color-text)]">{name}</h3>
          {priceDisplay != null && priceDisplay !== '' ? (
            <span className="whitespace-nowrap font-bold text-[var(--color-accent-primary)]">{priceDisplay}</span>
          ) : null}
        </div>

        {children}
        {footer}
      </div>
    </AnimatedCard>
  )
}
