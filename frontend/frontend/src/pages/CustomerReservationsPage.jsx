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
import { fetchMyReservations } from '../store/customerReservationsSlice'

const statusStyles = {
  pending: 'bg-surface-container-highest text-outline',
  confirmed: 'bg-primary-fixed text-on-primary-fixed-variant',
  seated: 'bg-secondary-container text-on-secondary-container',
  completed: 'bg-secondary-container text-on-secondary-container',
  cancelled: 'bg-error-container text-on-error-container',
  no_show: 'bg-error-container text-on-error-container',
}

const RESERVATION_STATUSES = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show']
const formatStatus = (status) => String(status || '').replaceAll('_', ' ')
const dateInputClass =
  'mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent-primary)] focus:shadow-[0_0_0_3px_rgba(255,77,0,0.22)] transition-[border-color,box-shadow] duration-300'
const emptyDraft = { status: '', from: '', to: '' }

export default function CustomerReservationsPage() {
  usePageTitle('Reservation history')
  const dispatch = useDispatch()
  const { list, loading, error, page, limit, total, totalPages, filters } = useSelector((state) => state.customerReservations)
  const [draft, setDraft] = useState(filters || emptyDraft)

  useEffect(() => {
    dispatch(fetchMyReservations({ page: 1, limit: limit || 10, ...filters }))
  }, [dispatch])

  const hasFilters = Boolean(filters.status || filters.from || filters.to)

  const applyFilters = (event) => {
    event.preventDefault()
    dispatch(fetchMyReservations({ ...draft, page: 1, limit }))
  }

  const resetFilters = () => {
    setDraft(emptyDraft)
    dispatch(fetchMyReservations({ page: 1, limit, ...emptyDraft }))
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
          title="Reservation history"
        />

        <form onSubmit={applyFilters} className="bg-surface border border-outline-variant rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AnimatedSelect
              label="Status"
              className="capitalize"
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              <option value="">All statuses</option>
              {RESERVATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
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
            icon="table_restaurant"
            title={hasFilters ? 'No reservations match these filters' : 'No reservations yet'}
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
              {list.map((row) => (
                <ReservationCard key={row._id} reservation={row} />
              ))}
            </AnimatedCardGrid>
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
              <Pagination
                summary={`Showing ${from}-${to} of ${total}`}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(next) => dispatch(fetchMyReservations({ ...filters, page: next, limit }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReservationCard({ reservation }) {
  const restaurant = reservation.restaurantId || {}
  return (
    <AnimatedCard staggerChild className="p-4">
      <Link to={`/customer/reservations/${reservation._id}`} className="flex gap-4">
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
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${statusStyles[reservation.status] || statusStyles.pending}`}>
              {formatStatus(reservation.status)}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            {reservation.reservationDate} · {reservation.timeSlot} · {reservation.partySize} guest{reservation.partySize === 1 ? '' : 's'}
          </p>
        </div>
      </Link>
      {reservation.preOrder ? (
        <Link
          to={`/customer/reservations/${reservation._id}/pre-order`}
          className="text-xs text-secondary hover:underline inline-block mt-2 ml-20"
        >
          Pre-order: {reservation.preOrder.itemCount} item{reservation.preOrder.itemCount === 1 ? '' : 's'}, {restaurant.currency || 'PKR'}{' '}
          {Number(reservation.preOrder.totalAmount || 0).toFixed(2)} — {reservation.canModifyPreOrder ? 'View/Edit' : 'View'}
        </Link>
      ) : null}
    </AnimatedCard>
  )
}
