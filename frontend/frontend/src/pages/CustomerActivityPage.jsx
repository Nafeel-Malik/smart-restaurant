import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import { GRID, STAT_LABEL } from '../constants/breakpoints'
import usePageTitle from '../hooks/usePageTitle'
import { fetchActivity } from '../store/customerActivitySlice'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  EmptyState,
  PageHero,
  ScrollReveal,
  SkeletonList,
} from '../components/motion'

const formatStatus = (status) => String(status || '').replaceAll('_', ' ')

export default function CustomerActivityPage() {
  usePageTitle('Activity')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { summary, recentOrders, recentReservations, loading, error } = useSelector((state) => state.customerActivity)

  useEffect(() => {
    dispatch(fetchActivity())
  }, [dispatch])

  const feed = useMemo(() => {
    const orders = (recentOrders || []).map((order) => ({
      id: `order-${order._id}`,
      kind: 'order',
      date: order.createdAt,
      title: order.restaurantId?.name || 'Order',
      subtitle: `${formatStatus(order.orderType)} · ${formatStatus(order.status)} · ${order.restaurantId?.currency || 'PKR'} ${Number(order.totalAmount || 0).toFixed(2)}`,
      to: `/customer/orders/${order._id}`,
    }))
    const reservations = (recentReservations || []).map((row) => ({
      id: `reservation-${row._id}`,
      kind: 'reservation',
      date: row.createdAt || row.reservationDate,
      title: row.restaurantId?.name || 'Reservation',
      subtitle: `${row.reservationDate} ${row.timeSlot} · ${formatStatus(row.status)}`,
      to: `/customer/reservations/${row._id}`,
    }))
    return [...orders, ...reservations].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
  }, [recentOrders, recentReservations])

  const memberSince = summary?.memberSince
    ? new Date(summary.memberSince).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-3xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat
          eyebrow={
            <Link
              to="/customer/dashboard"
              className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2"
            >
              <Icon name="arrow_back" size={16} />
              Dashboard
            </Link>
          }
          title="Activity"
          subtitle="Your orders, reservations, and spending at a glance."
        />

        {error && <div className="p-4 bg-error-container text-on-error-container rounded-lg text-sm">{error}</div>}

        {loading && !summary ? (
          <SkeletonList count={4} />
        ) : (
          <>
            <ScrollReveal>
              <AnimatedCardGrid className={`${GRID.stats} gap-3`}>
                <StatCard icon="receipt_long" label="Orders" value={summary?.totalOrders ?? 0} />
                <StatCard icon="table_restaurant" label="Reservations" value={summary?.totalReservations ?? 0} />
                <StatCard icon="payments" label="Total spent" value={`PKR ${Number(summary?.totalSpent || 0).toFixed(2)}`} />
                <StatCard icon="calendar_month" label="Member since" value={memberSince} />
              </AnimatedCardGrid>
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <section className="flex flex-wrap gap-2">
                <AnimatedButton onClick={() => navigate('/customer/orders')}>
                  <Icon name="receipt_long" size={18} />
                  Order history
                </AnimatedButton>
                <AnimatedButton variant="secondary" onClick={() => navigate('/customer/reservations')}>
                  <Icon name="table_restaurant" size={18} />
                  Reservation history
                </AnimatedButton>
              </section>
            </ScrollReveal>

            <ScrollReveal delay={0.12}>
              <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant">
                  <h2 className="font-semibold">Recent activity</h2>
                </div>
                {feed.length === 0 ? (
                  <EmptyState
                    className="border-0 rounded-none"
                    icon="history"
                    title="No recent activity"
                    hint="No recent orders or reservations yet."
                  />
                ) : (
                  <ul className="divide-y divide-outline-variant">
                    {feed.map((item) => (
                      <li key={item.id}>
                        <Link to={item.to} className="flex items-start gap-3 px-5 py-4 hover:bg-surface-container-low">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                            <Icon name={item.kind === 'order' ? 'receipt_long' : 'table_restaurant'} size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{item.title}</p>
                            <p className="text-sm text-on-surface-variant capitalize">{item.subtitle}</p>
                            <p className="text-xs text-outline mt-1">{item.date ? new Date(item.date).toLocaleString() : ''}</p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </ScrollReveal>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <AnimatedCard staggerChild className="p-4">
      <div className="flex items-center gap-2 text-on-surface-variant mb-2">
        <Icon name={icon} size={18} />
        <span className={`${STAT_LABEL} text-xs`}>{label}</span>
      </div>
      <p className="font-headline-sm font-bold text-primary break-words">{value}</p>
    </AnimatedCard>
  )
}
