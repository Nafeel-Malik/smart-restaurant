import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import { mediaSrc } from '../components/cards/RestaurantCard'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  AnimatedSelect,
  EmptyState,
  MotionBanner,
  PageHero,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { fetchAddresses } from '../store/customerAddressSlice'
import { clearCart, removeFromCart, selectCartSubtotal, updateQuantity } from '../store/customerCartSlice'
import { clearOrderFeedback, placeOrder } from '../store/customerOrdersSlice'
import { hasPhone } from '../utils/phone'

/** Shared navigate state when leaving checkout to set up / fix an address. */
export const CHECKOUT_ADDRESS_RETURN = {
  returnTo: '/customer/cart',
  reason: 'checkout',
}

export default function CustomerCart() {
  usePageTitle('Checkout')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const cart = useSelector((state) => state.customerCart)
  const subtotal = useSelector(selectCartSubtotal)
  const addresses = useSelector((state) => state.customerAddresses.list)
  const { placing, error, success } = useSelector((state) => state.customerOrders)
  const [addressId, setAddressId] = useState('')
  const [checkoutError, setCheckoutError] = useState('')

  // Capture once so clearing location.state doesn't lose the preferred address before list loads
  const preferredAddressIdRef = useRef(location.state?.selectedAddressId || '')
  const usableAddresses = useMemo(() => addresses.filter((a) => hasPhone(a.phone)), [addresses])
  const incompleteAddresses = useMemo(() => addresses.filter((a) => !hasPhone(a.phone)), [addresses])

  const addressesLinkState = (intent) => ({
    ...CHECKOUT_ADDRESS_RETURN,
    intent,
  })

  useEffect(() => {
    dispatch(fetchAddresses())
    dispatch(clearOrderFeedback())
  }, [dispatch])

  useEffect(() => {
    if (location.state?.selectedAddressId) {
      preferredAddressIdRef.current = location.state.selectedAddressId
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.selectedAddressId, location.pathname, navigate])

  useEffect(() => {
    if (!usableAddresses.length) {
      setAddressId('')
      return
    }
    const preferredId = preferredAddressIdRef.current
    setAddressId((current) => {
      if (preferredId && usableAddresses.some((a) => a._id === preferredId)) {
        preferredAddressIdRef.current = ''
        return preferredId
      }
      if (current && usableAddresses.some((a) => a._id === current)) return current
      const preferred = usableAddresses.find((a) => a.isDefault) || usableAddresses[0]
      return preferred._id
    })
  }, [usableAddresses])

  const handlePlaceOrder = async () => {
    setCheckoutError('')
    if (!cart.restaurantId || cart.items.length === 0) return
    if (!addressId) {
      setCheckoutError(
        incompleteAddresses.length
          ? 'Select an address that has a phone number, or edit an address to add one.'
          : 'Please select a delivery address, or add one first.',
      )
      return
    }
    const selected = usableAddresses.find((a) => a._id === addressId)
    if (!selected) {
      setCheckoutError('Selected address is missing a phone number. Update it before ordering.')
      return
    }
    const result = await dispatch(
      placeOrder({
        restaurantId: cart.restaurantId,
        deliveryAddressId: addressId,
        items: cart.items.map((item) => ({ foodId: item.foodId, quantity: item.quantity })),
      })
    )
    if (placeOrder.fulfilled.match(result)) {
      dispatch(clearCart())
      navigate(`/customer/orders/${result.payload._id}`, { state: { justPlaced: true } })
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-3xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat={false}
          eyebrow={
            <Link to="/customer/restaurants" className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2">
              <Icon name="arrow_back" size={16} />
              Continue browsing
            </Link>
          }
          title="Checkout"
          subtitle={cart.restaurantName || 'No restaurant selected'}
        />

        {(error || checkoutError) && (
          <MotionBanner type="error">{error || checkoutError}</MotionBanner>
        )}
        {success && !error && !checkoutError && (
          <MotionBanner type="success">{success}</MotionBanner>
        )}

        {cart.items.length === 0 ? (
          <EmptyState
            icon="shopping_cart"
            title="Your cart is empty"
            action={
              <Link to="/customer/restaurants">
                <AnimatedButton variant="secondary">Browse restaurants</AnimatedButton>
              </Link>
            }
          />
        ) : (
          <>
            <AnimatedCardGrid className="space-y-3">
              {cart.items.map((item) => (
                <AnimatedCard key={item.foodId} staggerChild className="flex gap-3 p-4">
                  <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0">
                    {mediaSrc(item.image) ? (
                      <img src={mediaSrc(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-outline">
                        <Icon name="restaurant" size={22} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between gap-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <button type="button" className="text-error" onClick={() => dispatch(removeFromCart(item.foodId))}>
                        <Icon name="delete" size={18} />
                      </button>
                    </div>
                    <p className="text-sm text-primary font-semibold">
                      {cart.restaurantCurrency} {item.price}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 border border-outline-variant rounded-full px-2 py-1">
                      <button type="button" onClick={() => dispatch(updateQuantity({ foodId: item.foodId, quantity: item.quantity - 1 }))}>
                        <Icon name="remove" size={16} />
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                      <button type="button" onClick={() => dispatch(updateQuantity({ foodId: item.foodId, quantity: item.quantity + 1 }))}>
                        <Icon name="add" size={16} />
                      </button>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </AnimatedCardGrid>

            <AnimatedCard className="p-5 space-y-3">
              <h2 className="font-semibold">Delivery address</h2>
              {addresses.length === 0 ? (
                <p className="text-sm text-on-surface-variant">
                  No saved addresses.{' '}
                  <Link
                    to="/customer/addresses"
                    state={addressesLinkState('add')}
                    className="text-secondary font-semibold hover:underline"
                  >
                    Add a new address
                  </Link>
                </p>
              ) : usableAddresses.length === 0 ? (
                <div className="space-y-2 text-sm">
                  <p className="text-error">
                    Every saved address is missing a phone number. Add a phone on an address before placing a delivery order.
                  </p>
                  <Link
                    to="/customer/addresses"
                    state={addressesLinkState('fix-phone')}
                    className="text-secondary font-semibold hover:underline"
                  >
                    Update addresses
                  </Link>
                </div>
              ) : (
                <>
                  <AnimatedSelect
                    value={addressId}
                    onChange={(e) => setAddressId(e.target.value)}
                    label="Select address"
                  >
                    {usableAddresses.map((address) => (
                      <option key={address._id} value={address._id}>
                        {address.label} — {address.fullAddress}, {address.city}
                        {address.isDefault ? ' (Default)' : ''}
                      </option>
                    ))}
                  </AnimatedSelect>
                  {incompleteAddresses.length > 0 && (
                    <p className="text-xs text-on-surface-variant">
                      {incompleteAddresses.length} address{incompleteAddresses.length === 1 ? '' : 'es'} hidden until a phone number is added.{' '}
                      <Link
                        to="/customer/addresses"
                        state={addressesLinkState('fix-phone')}
                        className="text-secondary font-semibold hover:underline"
                      >
                        Fix now
                      </Link>
                    </p>
                  )}
                  <Link
                    to="/customer/addresses"
                    state={addressesLinkState('manage')}
                    className="text-sm text-secondary font-semibold hover:underline"
                  >
                    Manage addresses
                  </Link>
                </>
              )}
            </AnimatedCard>

            <AnimatedCard className="p-5 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  {cart.restaurantCurrency} {subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-outline">Payment is pending — gateway integration comes later.</p>
              <AnimatedButton className="w-full mt-2" onClick={handlePlaceOrder} disabled={placing || !addressId}>
                {placing ? 'Placing order…' : 'Place order'}
              </AnimatedButton>
            </AnimatedCard>
          </>
        )}
      </div>
    </div>
  )
}
