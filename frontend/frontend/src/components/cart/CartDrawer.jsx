import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../ui/Icon'
import AnimatedButton from '../motion/AnimatedButton'
import EmptyState from '../motion/EmptyState'
import { mediaSrc } from '../cards/RestaurantCard'
import { useMotionPrefs } from '../../motion/useMotionPrefs'
import { removeFromCart, selectCartCount, selectCartSubtotal, updateQuantity } from '../../store/customerCartSlice'

export default function CartDrawer({ open, onClose }) {
  const dispatch = useDispatch()
  const { reduced, spring, tween } = useMotionPrefs()
  const cart = useSelector((state) => state.customerCart)
  const count = useSelector(selectCartCount)
  const subtotal = useSelector(selectCartSubtotal)

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] flex justify-end motion-ds">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tween(0.2)}
            onClick={onClose}
          />
          <motion.aside
            className="relative w-full max-w-md bg-surface h-full shadow-2xl flex flex-col border-l border-outline-variant"
            initial={{ x: reduced ? 0 : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: reduced ? 0 : '100%' }}
            transition={spring}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
              <div>
                <h2 className="font-display text-2xl text-primary tracking-[0.06em]">Your cart</h2>
                <p className="text-sm text-on-surface-variant">
                  {cart.restaurantName || 'No restaurant selected'} · {count} item{count === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.items.length === 0 ? (
                <EmptyState icon="shopping_cart" title="Your cart is empty" hint="Add dishes from the menu to get started." />
              ) : (
                cart.items.map((item) => (
                  <motion.div
                    key={item.foodId}
                    layout
                    className="flex gap-3 border border-outline-variant rounded-xl p-3"
                  >
                    <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0">
                      {mediaSrc(item.image) ? (
                        <img src={mediaSrc(item.image)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-outline">
                          <Icon name="restaurant" size={22} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        <button
                          type="button"
                          className="text-error"
                          onClick={() => dispatch(removeFromCart(item.foodId))}
                        >
                          <Icon name="delete" size={18} />
                        </button>
                      </div>
                      <p className="text-sm text-primary font-semibold">
                        {cart.restaurantCurrency} {item.price}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 border border-outline-variant rounded-full px-2 py-1">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(updateQuantity({ foodId: item.foodId, quantity: item.quantity - 1 }))
                          }
                        >
                          <Icon name="remove" size={16} />
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(updateQuantity({ foodId: item.foodId, quantity: item.quantity + 1 }))
                          }
                        >
                          <Icon name="add" size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            <div className="border-t border-outline-variant p-5 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Subtotal</span>
                <span>
                  {cart.restaurantCurrency || 'PKR'} {subtotal.toFixed(2)}
                </span>
              </div>
              <Link to="/customer/cart" onClick={onClose} className="block">
                <AnimatedButton className="w-full" disabled={cart.items.length === 0}>
                  Checkout
                </AnimatedButton>
              </Link>
            </div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
