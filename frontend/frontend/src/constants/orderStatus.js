export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'out_for_delivery',
  'delivered',
  'cancelled',
]

export const formatOrderStatus = (status) => String(status || '').replaceAll('_', ' ')

/** Badge/chip styles — aligned with CustomerOrders history. */
export const orderStatusBadgeStyles = {
  pending: 'bg-surface-container-highest text-outline',
  confirmed: 'bg-primary-fixed text-on-primary-fixed-variant',
  preparing: 'bg-tertiary-container text-on-tertiary-container',
  ready: 'bg-secondary-container text-on-secondary-container',
  served: 'bg-secondary-container text-on-secondary-container',
  out_for_delivery: 'bg-secondary-container text-on-secondary-container',
  delivered: 'bg-secondary-container text-on-secondary-container',
  cancelled: 'bg-error-container text-on-error-container',
}

/** Subtle tint for the status <select> control itself. */
export const orderStatusSelectTones = {
  pending:
    'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  confirmed:
    'bg-[rgba(255,182,39,0.1)] text-[var(--color-accent-secondary)] border-[rgba(255,182,39,0.35)]',
  preparing:
    'bg-[rgba(255,77,0,0.1)] text-[var(--color-accent-primary)] border-[rgba(255,77,0,0.35)]',
  ready:
    'bg-[rgba(160,243,153,0.12)] text-[var(--color-on-secondary-container)] border-[rgba(160,243,153,0.35)]',
  served:
    'bg-[rgba(160,243,153,0.12)] text-[var(--color-on-secondary-container)] border-[rgba(160,243,153,0.35)]',
  out_for_delivery:
    'bg-[rgba(160,243,153,0.12)] text-[var(--color-on-secondary-container)] border-[rgba(160,243,153,0.35)]',
  delivered:
    'bg-[rgba(160,243,153,0.16)] text-[var(--color-on-secondary-container)] border-[rgba(160,243,153,0.45)]',
  cancelled:
    'bg-[rgba(200,29,37,0.14)] text-[var(--color-on-error-container)] border-[rgba(200,29,37,0.4)]',
}
