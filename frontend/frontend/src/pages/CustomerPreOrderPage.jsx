import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import MenuItemCard from '../components/cards/MenuItemCard'
import {
  AnimatedButton,
  AnimatedCardGrid,
  EmptyState,
  MotionBanner,
  PageHero,
  SkeletonGrid,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { fetchCustomerRestaurantMenu } from '../store/customerRestaurantsSlice'
import {
  cancelPreOrder,
  clearReservationFeedback,
  createPreOrder,
  fetchPreOrder,
  fetchReservationDetail,
  updatePreOrder,
} from '../store/customerReservationsSlice'

export default function CustomerPreOrderPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const reservation = useSelector((state) => state.customerReservations.detail)
  const {
    preOrder,
    canModifyPreOrder,
    loadingPreOrder,
    savingPreOrder,
    loading,
    error,
    success,
  } = useSelector((state) => state.customerReservations)
  const { menu, detail: restaurant, loadingMenu } = useSelector((state) => state.customerRestaurants)
  const [selection, setSelection] = useState({})

  usePageTitle('Pre-order food')

  useEffect(() => {
    if (!id) return
    dispatch(clearReservationFeedback())
    dispatch(fetchReservationDetail(id))
    dispatch(fetchPreOrder(id))
  }, [dispatch, id])

  const restaurantId = reservation?.restaurantId?._id || reservation?.restaurantId

  useEffect(() => {
    if (restaurantId) dispatch(fetchCustomerRestaurantMenu(restaurantId))
  }, [dispatch, restaurantId])

  useEffect(() => {
    if (!preOrder?.items) {
      setSelection({})
      return
    }
    const next = {}
    for (const item of preOrder.items) {
      const foodId = item.foodId?._id || item.foodId
      if (!foodId) continue
      next[foodId] = {
        foodId,
        name: item.name,
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 0),
        image: item.image || item.foodId?.image || '',
      }
    }
    setSelection(next)
  }, [preOrder])

  const lines = useMemo(() => Object.values(selection).filter((item) => item.quantity > 0), [selection])
  const itemCount = lines.reduce((sum, item) => sum + item.quantity, 0)
  const total = lines.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const currency = restaurant?.currency || reservation?.restaurantId?.currency || 'PKR'
  const hasExisting = Boolean(preOrder?._id)
  const canModify = Boolean(canModifyPreOrder && reservation?.canModifyPreOrder !== false)

  const addItem = (item) => {
    if (!canModify) return
    setSelection((current) => {
      const existing = current[item._id]
      return {
        ...current,
        [item._id]: {
          foodId: item._id,
          name: item.name,
          price: Number(item.price || 0),
          quantity: (existing?.quantity || 0) + 1,
          image: item.image || '',
        },
      }
    })
  }

  const changeQty = (foodId, quantity) => {
    if (!canModify) return
    setSelection((current) => {
      const next = { ...current }
      if (quantity <= 0) {
        delete next[foodId]
      } else if (next[foodId]) {
        next[foodId] = { ...next[foodId], quantity }
      }
      return next
    })
  }

  const payloadItems = () => lines.map((item) => ({ foodId: item.foodId, quantity: item.quantity }))

  const handleSave = async () => {
    if (lines.length === 0) return
    const thunk = hasExisting ? updatePreOrder : createPreOrder
    const result = await dispatch(thunk({ reservationId: id, items: payloadItems() }))
    if (thunk.fulfilled.match(result)) {
      dispatch(fetchReservationDetail(id))
    }
  }

  const handleCancelPreOrder = async () => {
    if (!window.confirm('Remove this pre-order?')) return
    const result = await dispatch(cancelPreOrder(id))
    if (cancelPreOrder.fulfilled.match(result)) {
      setSelection({})
      dispatch(fetchReservationDetail(id))
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden pb-28">
      <div className="max-w-5xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat={false}
          eyebrow={
            <Link
              to={`/customer/reservations/${id}`}
              className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2"
            >
              <Icon name="arrow_back" size={16} />
              Reservation
            </Link>
          }
          title={hasExisting ? 'Edit pre-order' : 'Pre-order food'}
          subtitle={
            <>
              {reservation?.restaurantId?.name || restaurant?.name || 'Restaurant'}
              {reservation?.reservationDate ? ` · ${reservation.reservationDate} ${reservation.timeSlot}` : ''}
            </>
          }
        />

        {!canModify && (
          <MotionBanner type="success" className="!bg-surface-container-high !text-on-surface">
            Pre-order can no longer be modified because this reservation is {String(reservation?.status || '').replaceAll('_', ' ') || 'no longer upcoming'}.
          </MotionBanner>
        )}

        {error && <MotionBanner type="error">{error}</MotionBanner>}
        {success && <MotionBanner type="success">{success}</MotionBanner>}

        {(loading || loadingPreOrder || loadingMenu) && menu.length === 0 ? (
          <SkeletonGrid count={6} />
        ) : menu.length === 0 ? (
          <EmptyState icon="restaurant_menu" title="No menu items yet" />
        ) : (
          menu.map((category) => (
            <section key={category._id} className="space-y-3">
              <h2 className="font-headline-sm font-semibold">{category.name}</h2>
              <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items?.map((item) => {
                  const qty = selection[item._id]?.quantity || 0
                  return (
                    <MenuItemCard
                      key={item._id}
                      staggerChild
                      name={item.name}
                      priceDisplay={`${currency} ${item.price}`}
                      categoryName={category.name}
                      image={item.image}
                    >
                      {qty > 0 ? (
                        <div className="flex items-center justify-between">
                          <button type="button" className="w-8 h-8 rounded-full border border-outline-variant" onClick={() => changeQty(item._id, qty - 1)} disabled={!canModify}>
                            −
                          </button>
                          <span className="font-semibold">{qty}</span>
                          <button type="button" className="w-8 h-8 rounded-full border border-outline-variant" onClick={() => changeQty(item._id, qty + 1)} disabled={!canModify}>
                            +
                          </button>
                        </div>
                      ) : (
                        <AnimatedButton className="w-full !py-2 !text-sm" onClick={() => addItem(item)} disabled={!canModify}>
                          <Icon name="add" size={16} />
                          Add
                        </AnimatedButton>
                      )}
                    </MenuItemCard>
                  )
                })}
              </AnimatedCardGrid>
            </section>
          ))
        )}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-surface border-t border-outline-variant p-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <p className="font-semibold">
              {itemCount} item{itemCount === 1 ? '' : 's'} · {currency} {total.toFixed(2)}
            </p>
            <p className="text-xs text-on-surface-variant">Kitchen will prepare this for your table</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasExisting && canModify && (
              <AnimatedButton variant="danger" onClick={handleCancelPreOrder} disabled={savingPreOrder}>
                Cancel Pre-Order
              </AnimatedButton>
            )}
            <AnimatedButton onClick={handleSave} disabled={!canModify || savingPreOrder || lines.length === 0}>
              {savingPreOrder ? 'Saving…' : hasExisting ? 'Update Pre-Order' : 'Confirm Pre-Order'}
            </AnimatedButton>
            <AnimatedButton variant="secondary" onClick={() => navigate(`/customer/reservations/${id}`)}>
              Done
            </AnimatedButton>
          </div>
        </div>
      </div>
    </div>
  )
}
