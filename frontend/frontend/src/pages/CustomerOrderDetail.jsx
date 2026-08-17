import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import {
  AnimatedButton,
  AnimatedCard,
  EmptyState,
  MotionBanner,
  PageHero,
  SkeletonList,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { cancelOrder, fetchOrderDetail, fetchOrderReceipt } from '../store/customerOrdersSlice'
import { fetchEligibleReviews } from '../store/customerReviewsSlice'
import ReviewFormModal from '../components/reviews/ReviewFormModal'

const CANCELLABLE = ['pending', 'confirmed']

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

const formatStatus = (status) => String(status || '').replaceAll('_', ' ')

export default function CustomerOrderDetail() {
  const { id } = useParams()
  const location = useLocation()
  const dispatch = useDispatch()
  const { detail, receipt, loading, cancelling, error } = useSelector((state) => state.customerOrders)
  const eligible = useSelector((state) => state.customerReviews.eligible)
  const [reviewOpen, setReviewOpen] = useState(false)
  usePageTitle('Order receipt')

  useEffect(() => {
    if (!id) return
    dispatch(fetchOrderDetail(id))
    dispatch(fetchOrderReceipt(id))
  }, [dispatch, id])

  const view = receipt || null
  const restaurant = view?.restaurant || detail?.restaurantId || {}
  const currency = restaurant.currency || 'PKR'
  const items = view?.items || detail?.items || []
  const subtotal = view?.subtotal ?? items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0)
  const total = view?.total ?? detail?.totalAmount ?? 0
  const address = view?.deliveryAddress || detail?.deliveryAddressSnapshot || detail?.deliveryAddressId
  const reservation = view?.reservation || detail?.reservationId
  const orderType = view?.orderType || detail?.orderType
  const status = view?.status || detail?.status
  const canCancel = CANCELLABLE.includes(detail?.status)
  const restaurantId = restaurant._id || detail?.restaurantId?._id || detail?.restaurantId
  const isReviewable =
    status === 'delivered' || (orderType === 'pre_order' && status === 'served')
  const canReview = isReviewable && (eligible?.orders || []).some((row) => String(row._id) === String(id))
  const foodOptions = (eligible?.orders || []).find((row) => String(row._id) === String(id))?.items || detail?.items || []

  useEffect(() => {
    if (isReviewable && restaurantId) dispatch(fetchEligibleReviews(restaurantId))
  }, [dispatch, isReviewable, restaurantId])

  const handleCancel = () => {
    if (!window.confirm('Cancel this order?')) return
    dispatch(cancelOrder(id))
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-3xl mx-auto py-10 space-y-stack-lg">
        <div className="no-print">
          <PageHero
            heat={false}
            eyebrow={
              <Link to="/customer/orders" className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2">
                <Icon name="arrow_back" size={16} />
                Order history
              </Link>
            }
            title="Receipt"
            actions={
              detail ? (
                <AnimatedButton variant="secondary" className="!py-2 !text-sm" onClick={() => window.print()}>
                  <Icon name="print" size={16} />
                  Print
                </AnimatedButton>
              ) : null
            }
          />
        </div>

        {location.state?.justPlaced && (
          <MotionBanner type="success" className="no-print">
            Order placed successfully. Payment status is pending until a payment gateway is added.
          </MotionBanner>
        )}

        {error && <MotionBanner type="error" className="no-print">{error}</MotionBanner>}

        {loading && !detail ? (
          <SkeletonList count={2} />
        ) : !detail ? (
          <EmptyState icon="receipt_long" title="Order not found" />
        ) : (
          <>
            <AnimatedCard id="order-receipt" className="p-6 space-y-5">
              <div className="text-center border-b border-outline-variant pb-4">
                <p className="text-xs uppercase tracking-widest text-outline font-bold">RestoPro</p>
                <h2 className="font-headline-sm font-bold mt-1">{restaurant.name || 'Restaurant'}</h2>
                <p className="text-sm text-on-surface-variant capitalize mt-1">{formatStatus(orderType)} order</p>
                <p className="text-xs text-outline mt-1">
                  {(view?.placedAt || detail.createdAt) ? new Date(view?.placedAt || detail.createdAt).toLocaleString() : ''}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${statusStyles[status] || statusStyles.pending}`}>
                  {formatStatus(status)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Payment</span>
                <span className="capitalize">{view?.paymentStatus || detail.paymentStatus || 'pending'}</span>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm">
                      <span>
                        {item.quantity} × {item.name}
                        <span className="block text-xs text-outline">
                          {currency} {Number(item.price || 0).toFixed(2)} each
                        </span>
                      </span>
                      <span className="font-semibold whitespace-nowrap">
                        {currency} {Number(item.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm pt-3 mt-3 border-t border-outline-variant">
                  <span>Subtotal</span>
                  <span>
                    {currency} {Number(subtotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-2">
                  <span>Total</span>
                  <span>
                    {currency} {Number(total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {orderType === 'delivery' && address && (
                <div className="pt-2 border-t border-outline-variant">
                  <h3 className="font-semibold mb-1">Delivery address</h3>
                  <p className="text-sm">{address.label || 'Address'}</p>
                  <p className="text-sm text-on-surface-variant">{address.fullAddress}</p>
                  <p className="text-sm text-on-surface-variant">{[address.area, address.city].filter(Boolean).join(', ')}</p>
                  {address.phone && <p className="text-sm text-on-surface-variant">{address.phone}</p>}
                </div>
              )}

              {orderType === 'pre_order' && reservation && (
                <div className="pt-2 border-t border-outline-variant">
                  <h3 className="font-semibold mb-1">Table reservation</h3>
                  <p className="text-sm text-on-surface-variant">
                    {reservation.reservationDate ? String(reservation.reservationDate).slice(0, 10) : ''} · {reservation.timeSlot}
                    {reservation.partySize ? ` · ${reservation.partySize} guests` : ''}
                  </p>
                  {reservation._id && (
                    <Link to={`/customer/reservations/${reservation._id}`} className="no-print text-sm text-secondary font-semibold hover:underline">
                      View reservation
                    </Link>
                  )}
                </div>
              )}
            </AnimatedCard>

            {canReview && (
              <AnimatedButton className="no-print" onClick={() => setReviewOpen(true)}>
                <Icon name="rate_review" size={18} />
                Leave a Review
              </AnimatedButton>
            )}

            {canCancel && (
              <AnimatedButton variant="danger" className="no-print" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel order'}
              </AnimatedButton>
            )}
          </>
        )}
      </div>
      <ReviewFormModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        restaurantId={restaurantId}
        orderId={id}
        foodOptions={foodOptions}
        onSaved={() => restaurantId && dispatch(fetchEligibleReviews(restaurantId))}
      />
    </div>
  )
}
