import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import { mediaSrc } from '../components/cards/RestaurantCard'
import {
  AnimatedButton,
  AnimatedCard,
  EmptyState,
  MotionBanner,
  PageHero,
  SkeletonList,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { cancelReservation, fetchReservationDetail } from '../store/customerReservationsSlice'
import { fetchEligibleReviews } from '../store/customerReviewsSlice'
import ReviewFormModal from '../components/reviews/ReviewFormModal'

const CANCELLABLE = ['pending', 'confirmed']

const statusStyles = {
  pending: 'bg-surface-container-highest text-outline',
  confirmed: 'bg-primary-fixed text-on-primary-fixed-variant',
  seated: 'bg-secondary-container text-on-secondary-container',
  completed: 'bg-secondary-container text-on-secondary-container',
  cancelled: 'bg-error-container text-on-error-container',
  no_show: 'bg-error-container text-on-error-container',
}

const formatStatus = (status) => String(status || '').replaceAll('_', ' ')

function isUpcoming(row) {
  if (!row?.reservationDate) return false
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const todayStr = `${y}-${m}-${d}`
  if (row.reservationDate > todayStr) return true
  if (row.reservationDate < todayStr) return false
  const [hours, minutes] = String(row.timeSlot || '00:00').split(':').map(Number)
  return hours * 60 + minutes > today.getHours() * 60 + today.getMinutes()
}

export default function CustomerReservationDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { detail, loading, cancelling, error } = useSelector((state) => state.customerReservations)
  const eligible = useSelector((state) => state.customerReviews.eligible)
  const [reviewOpen, setReviewOpen] = useState(false)
  usePageTitle('Reservation details')

  useEffect(() => {
    if (id) dispatch(fetchReservationDetail(id))
  }, [dispatch, id])

  const restaurant = detail?.restaurantId || {}
  const canCancel = CANCELLABLE.includes(detail?.status) && isUpcoming(detail)
  const restaurantId = restaurant._id || detail?.restaurantId
  const canReview =
    detail?.status === 'completed' &&
    (eligible?.reservations || []).some((row) => String(row._id) === String(detail._id))

  useEffect(() => {
    if (detail?.status === 'completed' && restaurantId) dispatch(fetchEligibleReviews(restaurantId))
  }, [dispatch, detail?.status, restaurantId])

  const handleCancel = () => {
    if (!window.confirm('Cancel this reservation?')) return
    dispatch(cancelReservation(id))
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-3xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat={false}
          eyebrow={
            <Link to="/customer/reservations" className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2">
              <Icon name="arrow_back" size={16} />
              My reservations
            </Link>
          }
          title="Reservation details"
        />

        {location.state?.justBooked && (
          <MotionBanner type="success">
            Reservation confirmed. We will hold the table for your party.
          </MotionBanner>
        )}

        {error && <MotionBanner type="error">{error}</MotionBanner>}

        {loading && !detail ? (
          <SkeletonList count={3} />
        ) : !detail ? (
          <EmptyState icon="event_busy" title="Reservation not found" />
        ) : (
          <>
            <AnimatedCard className="p-5 space-y-3">
              <div className="flex items-start gap-4">
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
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold">{restaurant.name || 'Restaurant'}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${statusStyles[detail.status] || statusStyles.pending}`}>
                      {formatStatus(detail.status)}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {detail.reservationDate} · {detail.timeSlot}
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    {detail.partySize} guest{detail.partySize === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </AnimatedCard>

            <AnimatedCard className="p-5 space-y-1">
              <h2 className="font-semibold">Contact</h2>
              <p className="text-sm text-on-surface-variant">{detail.contactPhone}</p>
              {detail.specialRequests ? (
                <>
                  <h2 className="font-semibold pt-3">Special requests</h2>
                  <p className="text-sm text-on-surface-variant">{detail.specialRequests}</p>
                </>
              ) : null}
            </AnimatedCard>

            <AnimatedCard className="p-5 space-y-3">
              <h2 className="font-semibold">Pre-order</h2>
              {detail.preOrder ? (
                <>
                  <p className="text-sm text-on-surface-variant">
                    Pre-order: {detail.preOrder.itemCount} item{detail.preOrder.itemCount === 1 ? '' : 's'}, {restaurant.currency || 'PKR'}{' '}
                    {Number(detail.preOrder.totalAmount || 0).toFixed(2)}
                  </p>
                  <Link to={`/customer/reservations/${detail._id}/pre-order`} className="text-secondary font-semibold hover:underline text-sm">
                    {detail.canModifyPreOrder ? 'View/Edit' : 'View'}
                  </Link>
                </>
              ) : detail.canModifyPreOrder ? (
                <>
                  {location.state?.justBooked && (
                    <p className="text-sm text-on-surface-variant">Pre-order food for this reservation?</p>
                  )}
                  <AnimatedButton onClick={() => navigate(`/customer/reservations/${detail._id}/pre-order`)}>
                    <Icon name="restaurant_menu" size={18} />
                    Pre-order food
                  </AnimatedButton>
                </>
              ) : (
                <p className="text-sm text-on-surface-variant">No pre-order attached.</p>
              )}
            </AnimatedCard>

            {canReview && (
              <AnimatedButton onClick={() => setReviewOpen(true)}>
                <Icon name="rate_review" size={18} />
                Leave a Review
              </AnimatedButton>
            )}

            {canCancel && (
              <AnimatedButton variant="danger" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel reservation'}
              </AnimatedButton>
            )}
          </>
        )}
      </div>
      <ReviewFormModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        restaurantId={restaurantId}
        reservationId={detail?._id}
        onSaved={() => restaurantId && dispatch(fetchEligibleReviews(restaurantId))}
      />
    </div>
  )
}
