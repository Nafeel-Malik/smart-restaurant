import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import Icon from './Icon'
import { useMotionPrefs } from '../../motion/useMotionPrefs'
import {
  checkFoodFavorite,
  checkRestaurantFavorite,
  selectIsFoodFavorited,
  selectIsRestaurantFavorited,
  toggleFavoriteFood,
  toggleFavoriteRestaurant,
} from '../../store/customerFavoritesSlice'

export default function FavoriteButton({ type, id, className = '' }) {
  const dispatch = useDispatch()
  const { reduced, spring } = useMotionPrefs()
  const restaurantStatus = useSelector((state) => state.customerFavorites.restaurantStatus)
  const foodStatus = useSelector((state) => state.customerFavorites.foodStatus)
  const togglingRestaurantId = useSelector((state) => state.customerFavorites.togglingRestaurantId)
  const togglingFoodId = useSelector((state) => state.customerFavorites.togglingFoodId)
  const isFavorited = useSelector((state) =>
    type === 'food' ? selectIsFoodFavorited(state, id) : selectIsRestaurantFavorited(state, id)
  )

  const statusKnown =
    type === 'food'
      ? Object.prototype.hasOwnProperty.call(foodStatus, String(id || ''))
      : Object.prototype.hasOwnProperty.call(restaurantStatus, String(id || ''))

  const toggling =
    type === 'food' ? togglingFoodId === id : togglingRestaurantId === id

  useEffect(() => {
    if (!id || statusKnown) return
    if (type === 'food') dispatch(checkFoodFavorite(id))
    else dispatch(checkRestaurantFavorite(id))
  }, [dispatch, id, type, statusKnown])

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!id || toggling) return
    if (type === 'food') dispatch(toggleFavoriteFood(id))
    else dispatch(toggleFavoriteRestaurant(id))
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={toggling}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      whileTap={reduced ? undefined : { scale: 0.86 }}
      animate={
        isFavorited && !reduced
          ? { scale: [1, 1.22, 1], color: '#c81d25' }
          : { scale: 1, color: isFavorited ? '#c81d25' : '#9a9086' }
      }
      transition={spring}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-lowest/95 border border-outline-variant shadow-sm hover:bg-surface-container transition-colors disabled:opacity-60 ${className}`}
    >
      <Icon name="favorite" filled={isFavorited} size={20} />
    </motion.button>
  )
}
