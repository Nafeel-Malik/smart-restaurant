import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { GRID, STAT_LABEL } from '../constants/breakpoints'
import usePageTitle from '../hooks/usePageTitle'
import { logoutCustomer } from '../store/customerAuthSlice'
import { fetchActivity } from '../store/customerActivitySlice'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  PageHero,
  SkeletonBlock,
} from '../components/motion'

const LINKS = [
  { label: 'Profile', path: '/customer/profile', icon: 'person', hint: 'Name, photo, password' },
  { label: 'Addresses', path: '/customer/addresses', icon: 'location_on', hint: 'Delivery addresses' },
  { label: 'Favorites', path: '/customer/favorites', icon: 'favorite', hint: 'Saved restaurants and dishes' },
  { label: 'Restaurants', path: '/customer/restaurants', icon: 'storefront', hint: 'Menus, orders, tables' },
  { label: 'Orders', path: '/customer/orders', icon: 'receipt_long', hint: 'Delivery and pre-order history' },
  { label: 'Reservations', path: '/customer/reservations', icon: 'table_restaurant', hint: 'Table bookings' },
  { label: 'Reviews', path: '/customer/reviews', icon: 'rate_review', hint: 'Ratings you have left' },
  { label: 'Activity', path: '/customer/activity', icon: 'history', hint: 'Combined history and stats' },
]

export default function CustomerDashboard() {
  usePageTitle('Customer Dashboard')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const customer = useSelector((state) => state.customerAuth.customer)
  const { summary, loading } = useSelector((state) => state.customerActivity)

  useEffect(() => {
    dispatch(fetchActivity())
  }, [dispatch])

  const handleLogout = async () => {
    await dispatch(logoutCustomer())
    navigate('/customer/login')
  }

  const memberSince = summary?.memberSince
    ? new Date(summary.memberSince).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
    : '—'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <PageHero
          heat
          eyebrow={
            <p className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-1">
              Customer portal · RestoPro
            </p>
          }
          title={`Welcome back, ${customer?.fullName || 'guest'}`}
          subtitle={
            <p>
              {customer?.email || ''} {customer?.phone ? `· ${customer.phone}` : ''}
            </p>
          }
          actions={
            <AnimatedButton variant="ghost" onClick={handleLogout}>
              <Icon name="logout" size={18} />
              Log out
            </AnimatedButton>
          }
        />

        {loading && !summary ? (
          <AnimatedCardGrid className={`${GRID.stats} gap-3`}>
            {[0, 1, 2, 3].map((i) => (
              <AnimatedCard key={i} staggerChild className="p-3 !bg-surface-container-low">
                <SkeletonBlock className="h-3 w-1/2 mb-2" />
                <SkeletonBlock className="h-5 w-3/4" />
              </AnimatedCard>
            ))}
          </AnimatedCardGrid>
        ) : (
          <AnimatedCardGrid className={`${GRID.stats} gap-3`}>
            <Stat label="Orders" value={summary?.totalOrders ?? 0} icon="receipt_long" />
            <Stat label="Reservations" value={summary?.totalReservations ?? 0} icon="table_restaurant" />
            <Stat
              label="Spent"
              value={`PKR ${Number(summary?.totalSpent || 0).toFixed(0)}`}
              icon="payments"
            />
            <Stat label="Member since" value={memberSince} icon="calendar_month" />
          </AnimatedCardGrid>
        )}

        <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LINKS.map((link) => (
            <AnimatedCard key={link.path} staggerChild className="!p-0 overflow-hidden">
              <button
                type="button"
                onClick={() => navigate(link.path)}
                className="flex min-h-[44px] w-full items-start gap-3 p-4 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <Icon name={link.icon} size={20} />
                </div>
                <div>
                  <p className="font-semibold">{link.label}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{link.hint}</p>
                </div>
              </button>
            </AnimatedCard>
          ))}
        </AnimatedCardGrid>
    </div>
  )
}

function Stat({ label, value, icon }) {
  return (
    <AnimatedCard staggerChild className="p-3 !bg-surface-container-low">
      <div className="flex items-center gap-1 text-on-surface-variant mb-1">
        <Icon name={icon} size={16} />
        <span className={`${STAT_LABEL} text-[11px]`}>{label}</span>
      </div>
      <p className="font-semibold text-primary break-words">{value}</p>
    </AnimatedCard>
  )
}
