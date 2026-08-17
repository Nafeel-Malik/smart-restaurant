import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  MotionBanner,
  PageHero,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { validatePhone } from '../utils/phone'
import { fetchCustomerRestaurant } from '../store/customerRestaurantsSlice'
import {
  fetchAvailableSlots,
  createReservationThunk,
  clearReservationFeedback,
} from '../store/customerReservationsSlice'

function todayDateOnly() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CustomerReservationPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const customer = useSelector((state) => state.customerAuth.customer)
  const restaurant = useSelector((state) => state.customerRestaurants.detail)
  const { slots, slotsMeta, loadingSlots, creating, error, success } = useSelector(
    (state) => state.customerReservations,
  )

  const [date, setDate] = useState(todayDateOnly())
  const [partySize, setPartySize] = useState(2)
  const [timeSlot, setTimeSlot] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [contactPhone, setContactPhone] = useState(customer?.phone || '')
  const [fieldErrors, setFieldErrors] = useState({})

  usePageTitle(restaurant?.name ? `Reserve · ${restaurant.name}` : 'Reserve a table')

  useEffect(() => {
    if (id) dispatch(fetchCustomerRestaurant(id))
    return () => {
      dispatch(clearReservationFeedback())
    }
  }, [dispatch, id])

  useEffect(() => {
    if (customer?.phone && !contactPhone) setContactPhone(customer.phone)
  }, [customer, contactPhone])

  useEffect(() => {
    if (!id || !date) return
    setTimeSlot('')
    dispatch(fetchAvailableSlots({ restaurantId: id, date, partySize: Number(partySize) || 1 }))
  }, [dispatch, id, date, partySize])

  const restaurantMatchesRoute = Boolean(restaurant && restaurant._id === id)
  const availableSlots = useMemo(() => slots.filter((slot) => slot.available), [slots])
  const restaurantName = restaurantMatchesRoute ? (restaurant.name || 'Restaurant') : 'Restaurant'

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearReservationFeedback())
    const errors = {}
    const phoneError = validatePhone(contactPhone)
    if (phoneError) errors.contactPhone = phoneError
    if (!timeSlot) errors.timeSlot = 'Select a time slot'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const result = await dispatch(
      createReservationThunk({
        restaurantId: id,
        reservationDate: date,
        timeSlot,
        partySize: Number(partySize),
        specialRequests: specialRequests.trim(),
        contactPhone: contactPhone.trim(),
      }),
    )
    if (createReservationThunk.fulfilled.match(result)) {
      navigate(`/customer/reservations/${result.payload._id}`, { state: { justBooked: true } })
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-3xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat={false}
          eyebrow={
            <Link
              to={`/customer/restaurants/${id}`}
              className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2"
            >
              <Icon name="arrow_back" size={16} />
              Restaurant
            </Link>
          }
          title="Reserve a table"
          subtitle={
            <>
              {restaurantMatchesRoute ? restaurant.name : restaurantName}
              {restaurantMatchesRoute && restaurant.openingTime
                ? ` · ${restaurant.openingTime} – ${restaurant.closingTime || '—'}`
                : ''}
            </>
          }
        />

        {success && <MotionBanner type="success">{success}</MotionBanner>}
        {error && <MotionBanner type="error">{error}</MotionBanner>}

        <AnimatedCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-stack-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatedInput
                id="reservationDate"
                label="Date"
                type="date"
                min={todayDateOnly()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <AnimatedInput
                id="partySize"
                label="Party size"
                type="number"
                min={1}
                max={50}
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                required
              />
            </div>

            <div className="space-y-unit">
              <p className="font-label-lg text-label-lg text-on-surface-variant">Available time slots</p>
              {slotsMeta && (
                <p className="text-xs text-outline">
                  Capacity {slotsMeta.totalCapacity || 0} seats
                  {slotsMeta.totalCapacity === 0 ? ' — this restaurant has no tables yet' : ''}
                </p>
              )}
              {loadingSlots ? (
                <p className="text-sm text-on-surface-variant">Loading slots…</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No available slots for this date and party size.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.timeSlot}
                      type="button"
                      onClick={() => setTimeSlot(slot.timeSlot)}
                      className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                        timeSlot === slot.timeSlot
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface border-outline-variant hover:border-primary text-on-surface'
                      }`}
                    >
                      {slot.timeSlot}
                      <span className="block text-[10px] font-normal opacity-80">{slot.remainingCapacity} seats left</span>
                    </button>
                  ))}
                </div>
              )}
              {fieldErrors.timeSlot && (
                <p className="text-xs text-error mt-1">{fieldErrors.timeSlot}</p>
              )}
            </div>

            <div className="space-y-unit">
              <label className="font-label-lg text-label-lg text-on-surface-variant" htmlFor="specialRequests">
                Special requests (optional)
              </label>
              <textarea
                id="specialRequests"
                rows={3}
                maxLength={500}
                placeholder="Window seat, birthday, high chair…"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg font-body-md text-body-md transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <div>
              <AnimatedInput
                id="contactPhone"
                label="Contact phone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
                error={fieldErrors.contactPhone}
              />
              {!customer?.phone && !contactPhone.trim() && (
                <p className="text-xs text-on-surface-variant mt-1">
                  Your profile has no phone on file — enter one to complete this reservation.
                </p>
              )}
            </div>

            <AnimatedButton type="submit" disabled={creating || !timeSlot || !date || Number(partySize) < 1} className="w-full">
              <Icon name="event_available" size={18} />
              {creating ? 'Confirming…' : 'Confirm Reservation'}
            </AnimatedButton>
          </form>
        </AnimatedCard>
      </div>
    </div>
  )
}
