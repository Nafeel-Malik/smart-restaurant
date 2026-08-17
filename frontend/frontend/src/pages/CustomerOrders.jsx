import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import { Pagination } from '../components/common'
import { mediaSrc } from '../components/cards/RestaurantCard'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  AnimatedSelect,
  EmptyState,
  MotionBanner,
  PageHero,
  SkeletonList,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { fetchMyOrders } from '../store/customerOrdersSlice'

const statusStyles = {
  pending: 'bg-surface-container-highest text-outline',
  confirmed: 'bg-primary-fixed text-on-primary-fixed-variant',
  preparing: 'bg-tertiary-container text-on-tertiary-container',
  ready: 'bg-secondary-container text-on-secondary-container',
  served: 'bg-secondary-container text-on-secondary-container',
  out_for_delivery: 'bg-secondary-container text-on-secondary-container',
  delivered: 'bg-secondary-container text-on-secondary-container',
  cancelled: 'bg-error-container text-on-error-container',
}

const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'out_for_delivery', 'delivered', 'cancelled']
const ORDER_TYPES = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'pre_order', label: 'Pre-order' },
]

const formatStatus = (status) => String(status || '').replaceAll('_', ' ')
const dateInputClass =
  'mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(255,77,0,0.22)] transition-[border-color,box-shadow] duration-300'

const emptyDraft = { status: '', orderType: '', from: '', to: '' }

export default function CustomerOrders() {
  usePageTitle('Order history')
  const dispatch = useDispatch()
  const { list, loading, error, page, limit, total, totalPages, filters } = useSelector((state) => state.customerOrders)
  const [draft, setDraft] = useState(filters || emptyDraft)

  useEffect(() => {
    dispatch(fetchMyOrders({ page: 1, limit: limit || 10, ...filters }))
  }, [dispatch])

  const hasFilters = Boolean(filters.status || filters.orderType || filters.from || filters.to)

  const applyFilters = (event) => {
    event.preventDefault()
    dispatch(fetchMyOrders({ ...draft, page: 1, limit }))
  }

  const resetFilters = () => {
    setDraft(emptyDraft)
    dispatch(fetchMyOrders({ page: 1, limit, ...emptyDraft }))
  }

  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-3xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat={false}
          eyebrow={
            <Link to="/customer/activity" className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2">
              <Icon name="arrow_back" size={16} />
              Activity
            </Link>
          }
          title="Order history"
        />

        <form onSubmit={applyFilters} className="bg-surface border border-outline-variant rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatedSelect
              label="Status"
              className="capitalize"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </AnimatedSelect>
            <AnimatedSelect
              label="Order type"
              value={draft.orderType}
              onChange={(e) => setDraft({ ...draft, orderType: e.target.value })}
            >
              <option value="">All types</option>
              {ORDER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </AnimatedSelect>
            <label className="text-xs font-semibold text-on-surface-variant">
              From
              <input type="date" className={dateInputClass} value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
            </label>
            <label className="text-xs font-semibold text-on-surface-variant">
              To
              <input type="date" className={dateInputClass} value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
            </label>
          </div>
          <div className="flex gap-2 flex-wrap">
            <AnimatedButton type="submit">Apply filters</AnimatedButton>
            <AnimatedButton type="button" variant="ghost" onClick={resetFilters}>Reset</AnimatedButton>
          </div>
        </form>

        {error && <MotionBanner type="error">{error}</MotionBanner>}

        {loading && list.length === 0 ? (
          <SkeletonList count={4} />
        ) : list.length === 0 ? (
          <EmptyState
            icon="receipt_long"
            title={hasFilters ? 'No orders match these filters' : 'No orders yet'}
            action={
              !hasFilters ? (
                <Link to="/customer/restaurants">
                  <AnimatedButton variant="secondary">Browse restaurants</AnimatedButton>
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="space-y-3">
            <AnimatedCardGrid className="space-y-3">
              {list.map((order) => {
                const restaurant = order.restaurantId || {}
                return (
                  <AnimatedCard key={order._id} staggerChild className="overflow-hidden p-0">
                    <Link
                      to={`/customer/orders/${order._id}`}
                      className="flex gap-4 p-4 hover:bg-surface-container-low/40 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0">
                        {mediaSrc(restaurant.logo) ? (
                          <img src={mediaSrc(restaurant.logo)} alt={restaurant.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-outline">
                            <Icon name="storefront" size={22} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold truncate">{restaurant.name || 'Restaurant'}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${statusStyles[order.status] || statusStyles.pending}`}>
                            {formatStatus(order.status)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-secondary capitalize mt-1">
                          {formatStatus(order.orderType || 'delivery')}
                        </p>
                        <p className="text-sm text-on-surface-variant mt-1">
                          {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'} · {restaurant.currency || 'PKR'} {Number(order.totalAmount || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-outline mt-1">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                    </Link>
                  </AnimatedCard>
                )
              })}
            </AnimatedCardGrid>
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
              <Pagination
                summary={`Showing ${from}-${to} of ${total}`}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(next) => dispatch(fetchMyOrders({ ...filters, page: next, limit }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
