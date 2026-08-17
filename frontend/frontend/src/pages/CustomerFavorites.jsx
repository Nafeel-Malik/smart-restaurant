import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import MenuItemCard from '../components/cards/MenuItemCard'
import FavoriteButton from '../components/ui/FavoriteButton'
import usePageTitle from '../hooks/usePageTitle'
import { resolveMediaUrl } from '../services/customerAuthApi'
import {
  fetchFavoriteFood,
  fetchFavoriteRestaurants,
  refId,
} from '../store/customerFavoritesSlice'
import {
  AnimatedCard,
  AnimatedCardGrid,
  EmptyState,
  PageHero,
  SkeletonGrid,
} from '../components/motion'

const TABS = [
  { id: 'restaurants', label: 'Favorite Restaurants', icon: 'storefront' },
  { id: 'food', label: 'Favorite Food', icon: 'restaurant' },
]

function mediaSrc(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return resolveMediaUrl(path)
}

function RestaurantCard({ favorite }) {
  const restaurant = favorite.restaurantId || {}
  const id = refId(restaurant) || refId(favorite.restaurantId)
  const logo = mediaSrc(restaurant.logo)

  return (
    <AnimatedCard staggerChild className="overflow-hidden shadow-sm !p-0">
      <div className="relative h-36 bg-surface-container">
        {logo ? (
          <img src={logo} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline">
            <Icon name="storefront" size={40} />
          </div>
        )}
        <FavoriteButton type="restaurant" id={id} className="absolute top-3 right-3" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-on-surface">{restaurant.name || 'Restaurant'}</h3>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
              restaurant.status === 1
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {restaurant.status === 1 ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant mt-2">
          {restaurant.openingTime || '—'} – {restaurant.closingTime || '—'}
        </p>
        <p className="text-xs text-outline mt-1">{restaurant.currency || 'PKR'}</p>
      </div>
    </AnimatedCard>
  )
}

function FoodCard({ favorite }) {
  const food = favorite.foodId || {}
  const id = refId(food) || refId(favorite.foodId)
  const restaurantName = food.restaurant?.name
  const currency = food.restaurant?.currency || 'PKR'

  return (
    <MenuItemCard
      staggerChild
      name={food.name || 'Food item'}
      priceDisplay={`${currency} ${food.price ?? '—'}`}
      categoryName={food.category?.name}
      image={food.image}
      imageOverlay={<FavoriteButton type="food" id={id} />}
    >
      {restaurantName ? (
        <p className="text-sm text-on-surface-variant">{restaurantName}</p>
      ) : null}
    </MenuItemCard>
  )
}

export default function CustomerFavorites() {
  usePageTitle('Favorites')
  const dispatch = useDispatch()
  const {
    restaurants,
    food,
    loadingRestaurants,
    loadingFood,
    error,
  } = useSelector((state) => state.customerFavorites)
  const [tab, setTab] = useState('restaurants')

  useEffect(() => {
    dispatch(fetchFavoriteRestaurants())
    dispatch(fetchFavoriteFood())
  }, [dispatch])

  const loading = tab === 'restaurants' ? loadingRestaurants : loadingFood
  const items = tab === 'restaurants' ? restaurants : food

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-5xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat
          eyebrow={
            <>
              <Link
                to="/customer/dashboard"
                className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2"
              >
                <Icon name="arrow_back" size={16} />
                Dashboard
              </Link>
              <p className="font-label-md text-label-md text-secondary uppercase tracking-widest">
                Account
              </p>
            </>
          }
          title="Favorites"
        />

        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-label-md font-semibold ${
                tab === item.id
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-error-container text-on-error-container rounded-lg flex items-center gap-2 text-sm">
            <Icon name="error" size={16} />
            {error}
          </div>
        )}

        {loading && items.length === 0 ? (
          <SkeletonGrid count={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="favorite"
            title={tab === 'restaurants' ? 'No favorite restaurants yet' : 'No favorite food yet'}
            hint={
              tab === 'restaurants'
                ? 'Tap the heart on a restaurant to save it here.'
                : 'Tap the heart on a dish to save it here.'
            }
          />
        ) : (
          <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tab === 'restaurants'
              ? restaurants.map((favorite) => (
                  <RestaurantCard key={favorite._id} favorite={favorite} />
                ))
              : food.map((favorite) => (
                  <FoodCard key={favorite._id} favorite={favorite} />
                ))}
          </AnimatedCardGrid>
        )}
      </div>
    </div>
  )
}
