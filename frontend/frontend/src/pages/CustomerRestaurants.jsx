import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import FavoriteButton from '../components/ui/FavoriteButton'
import RestaurantCard from '../components/cards/RestaurantCard'
import { GRID } from '../constants/breakpoints'
import usePageTitle from '../hooks/usePageTitle'
import { fetchCustomerRestaurants } from '../store/customerRestaurantsSlice'
import {
  AnimatedCardGrid,
  AnimatedInput,
  EmptyState,
  PageHero,
  SkeletonGrid,
} from '../components/motion'

export default function CustomerRestaurants() {
  usePageTitle('Browse Restaurants')
  const dispatch = useDispatch()
  const { list, loadingList, error } = useSelector((state) => state.customerRestaurants)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchCustomerRestaurants(search.trim()))
    }, 250)
    return () => clearTimeout(timer)
  }, [dispatch, search])

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
                Order delivery
              </p>
            </>
          }
          title="Restaurants"
        />

        <AnimatedInput
          id="restaurant-search"
          label="Search"
          placeholder="Search by restaurant name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {error && (
          <div className="p-4 bg-error-container text-on-error-container rounded-lg flex items-center gap-2 text-sm">
            <Icon name="error" size={16} />
            {typeof error === 'string' ? error : 'Failed to load restaurants'}
          </div>
        )}

        {loadingList && list.length === 0 ? (
          <SkeletonGrid count={6} />
        ) : list.length === 0 ? (
          <EmptyState
            icon="storefront"
            title="No restaurants found"
            hint="Try another search, or check back later."
          />
        ) : (
          <AnimatedCardGrid className={`${GRID.cardsThree} gap-4`}>
            {list.map((restaurant) => (
              <RestaurantCard
                key={restaurant._id}
                restaurant={restaurant}
                to={`/customer/restaurants/${restaurant._id}`}
                staggerChild
                actions={<FavoriteButton type="restaurant" id={restaurant._id} />}
              />
            ))}
          </AnimatedCardGrid>
        )}
      </div>
    </div>
  )
}
