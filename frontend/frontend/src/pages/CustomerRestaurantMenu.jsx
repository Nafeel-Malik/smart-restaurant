import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { mediaSrc } from '../components/cards/RestaurantCard'
import MenuItemCard from '../components/cards/MenuItemCard'
import FavoriteButton from '../components/ui/FavoriteButton'
import {
  AnimatedButton,
  AnimatedCardGrid,
  EmptyState,
  MotionBanner,
  PageHero,
  SkeletonGrid,
} from '../components/motion'
import { useMotionPrefs } from '../motion/useMotionPrefs'
import usePageTitle from '../hooks/usePageTitle'
import { fetchCustomerRestaurantMenu } from '../store/customerRestaurantsSlice'
import { addToCart, replaceCartAndAdd, selectCartCount } from '../store/customerCartSlice'
import RestaurantReviewsSection from '../components/reviews/RestaurantReviewsSection'
import CartDrawer from '../components/cart/CartDrawer'

export default function CustomerRestaurantMenu() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { detail, menu, loadingMenu, error } = useSelector((state) => state.customerRestaurants)
  const cart = useSelector((state) => state.customerCart)
  const cartCount = useSelector(selectCartCount)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartPulse, setCartPulse] = useState(false)
  const [lastAddedFoodId, setLastAddedFoodId] = useState(null)
  const pulseTimerRef = useRef(null)
  const { reduced, tween } = useMotionPrefs()

  usePageTitle(detail?.name ? `${detail.name} Menu` : 'Menu')

  useEffect(() => {
    if (id) dispatch(fetchCustomerRestaurantMenu(id))
  }, [dispatch, id])

  useEffect(() => () => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
  }, [])

  const triggerAddFeedback = (foodId) => {
    setLastAddedFoodId(foodId)
    setCartPulse(true)
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    pulseTimerRef.current = setTimeout(() => {
      setCartPulse(false)
      setLastAddedFoodId(null)
    }, reduced ? 50 : 700)
  }

  const handleAdd = (item) => {
    if (!detail) return
    if (cart.restaurantId && cart.restaurantId !== detail._id && cart.items.length > 0) {
      const ok = window.confirm(
        `Your cart has items from "${cart.restaurantName}". Clear it and start a new order from "${detail.name}"?`
      )
      if (!ok) return
      dispatch(replaceCartAndAdd({ restaurant: detail, item }))
      triggerAddFeedback(item._id)
      return
    }
    dispatch(addToCart({ restaurant: detail, item }))
    triggerAddFeedback(item._id)
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden pb-28">
      <div className="max-w-5xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat
          eyebrow={
            <Link to="/customer/restaurants" className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2">
              <Icon name="arrow_back" size={16} />
              Restaurants
            </Link>
          }
          title={detail?.name || 'Restaurant'}
          subtitle={
            <>
              <p>
                {detail?.openingTime || '—'} – {detail?.closingTime || '—'} · {detail?.currency || 'PKR'}
              </p>
              <p className="text-sm mt-1">
                {Number(detail?.averageRating || 0).toFixed(1)} ★ · {detail?.reviewCount || 0} review{(detail?.reviewCount || 0) === 1 ? '' : 's'}
              </p>
            </>
          }
          actions={
            <div className="flex items-center gap-2 shrink-0">
              {detail?._id && (
                <Link to={`/customer/restaurants/${detail._id}/reserve`}>
                  <AnimatedButton>
                    <Icon name="table_restaurant" size={18} />
                    Reserve a Table
                  </AnimatedButton>
                </Link>
              )}
              {detail?._id && <FavoriteButton type="restaurant" id={detail._id} />}
            </div>
          }
        />

        {error && <MotionBanner type="error">{error}</MotionBanner>}

        {loadingMenu && menu.length === 0 ? (
          <SkeletonGrid count={6} />
        ) : menu.length === 0 ? (
          <EmptyState icon="restaurant_menu" title="No menu items yet" />
        ) : (
          menu.map((category) => (
            <section key={category._id} className="space-y-3">
              <h2 className="font-headline-sm font-semibold">{category.name}</h2>
              <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((item) => (
                    <motion.div
                      key={item._id}
                      animate={
                        lastAddedFoodId === item._id && !reduced
                          ? {
                              scale: [1, 1.04, 1],
                              boxShadow: [
                                '0 0 0 0 rgba(255,77,0,0)',
                                '0 0 0 3px rgba(255,77,0,0.4), 0 0 28px rgba(255,77,0,0.45)',
                                '0 0 0 0 rgba(255,77,0,0)',
                              ],
                            }
                          : { scale: 1, boxShadow: '0 0 0 0 rgba(255,77,0,0)' }
                      }
                      transition={tween(0.55)}
                      className="rounded-xl h-full"
                    >
                      <MenuItemCard
                        staggerChild
                        name={item.name}
                        priceDisplay={`${detail?.currency || 'PKR'} ${item.price}`}
                        categoryName={category.name}
                        image={item.image}
                        imageOverlay={<FavoriteButton type="food" id={item._id} />}
                      >
                        <AnimatedButton
                          className="w-full !py-2 !text-sm"
                          onClick={() => handleAdd(item)}
                          disabled={detail && detail.isOpen === false}
                        >
                          <Icon name="add" size={16} />
                          Add to cart
                        </AnimatedButton>
                      </MenuItemCard>
                    </motion.div>
                ))}
              </AnimatedCardGrid>
            </section>
          ))
        )}

        {detail?._id && (
          <RestaurantReviewsSection
            restaurantId={detail._id}
            averageRating={detail.averageRating}
            reviewCount={detail.reviewCount}
          />
        )}
      </div>

      <motion.button
        type="button"
        onClick={() => setCartOpen(true)}
        animate={
          cartPulse && !reduced
            ? { scale: [1, 1.18, 1], boxShadow: ['0 10px 25px rgba(0,0,0,0.25)', '0 0 32px rgba(255,77,0,0.55)', '0 10px 25px rgba(0,0,0,0.25)'] }
            : { scale: 1 }
        }
        transition={tween(0.45)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-on-primary shadow-lg"
      >
        <Icon name="shopping_cart" size={20} />
        Cart
        {cartCount > 0 && (
          <span className="min-w-6 h-6 px-1.5 rounded-full bg-white text-primary text-sm font-bold flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </motion.button>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
