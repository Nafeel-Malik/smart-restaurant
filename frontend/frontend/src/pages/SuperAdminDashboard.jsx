import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import { StatusBadge } from '../components/common'
import ResponsiveDataTable from '../components/tables/ResponsiveDataTable'
import { GRID, STAT_LABEL } from '../constants/breakpoints'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  EmptyState,
  ScrollReveal,
  SkeletonList,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { fetchRestaurants } from '../store/restaurantSlice'
import { fetchManagers } from '../store/managerSlice'

const tableColumns = [
  { key: 'name', label: 'Restaurant', render: (row) => <span className="font-semibold">{row.name}</span> },
  { key: 'manager', label: 'Manager', hideOnTablet: true, render: (row) => row.assignedManager?.username || 'Unassigned' },
  { key: 'hours', label: 'Hours', hideOnTablet: true, render: (row) => `${row.openingTime} – ${row.closingTime}` },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status === 1 ? 'Active' : 'Inactive'} /> },
  { key: 'currency', label: 'Currency', align: 'right', hideOnTablet: true, render: (row) => row.currency },
]

export function SuperAdminDashboardContent() {
  usePageTitle('Super Admin Dashboard')
  const dispatch = useDispatch()
  const { list: restaurants, loading: restaurantsLoading } = useSelector((state) => state.restaurants)
  const { list: managers, loading: managersLoading } = useSelector((state) => state.managers)

  useEffect(() => {
    dispatch(fetchRestaurants())
    dispatch(fetchManagers())
  }, [dispatch])

  const activeCount = restaurants.filter((r) => r.status === 1).length
  const assignedManagers = managers.filter((m) => m.assignedRestaurant)
  const unassignedRestaurants = restaurants.filter((r) => !r.assignedManager)
  const recent = [...restaurants].slice(-5).reverse()

  const stats = [
    { label: 'Restaurants', value: restaurants.length, icon: 'storefront', note: `${activeCount} active` },
    { label: 'Active Branches', value: activeCount, icon: 'check_circle', note: 'Currently live' },
    { label: 'Managers', value: managers.length, icon: 'badge', note: `${assignedManagers.length} assigned` },
    { label: 'Unassigned', value: unassignedRestaurants.length, icon: 'warning', note: 'Need a manager' },
  ]

  return (
    <div className="relative pb-20 space-y-stack-lg">
      <AnimatedCardGrid className={`${GRID.stats} gap-stack-lg`}>
        {stats.map((stat) => (
          <AnimatedCard key={stat.label} staggerChild className="p-5">
            <div className="flex justify-between items-start mb-2">
              <p className={`${STAT_LABEL} flex items-start gap-2`}>
                <Icon name={stat.icon} className="mt-0.5 shrink-0 text-[18px]" />
                <span className="min-w-0">{stat.label}</span>
              </p>
            </div>
            <span className="font-numeral-lg text-numeral-lg text-primary font-bold">{stat.value}</span>
            {stat.note && <p className="mt-2 text-[10px] text-on-surface-variant">{stat.note}</p>}
          </AnimatedCard>
        ))}
      </AnimatedCardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
        <ScrollReveal className="lg:col-span-2 bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="px-gutter py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
              Recent Restaurants
            </h3>
            <Link to="/restaurants" className="text-primary font-label-md hover:underline">
              View All Records
            </Link>
          </div>
          {restaurantsLoading && recent.length === 0 ? (
            <div className="p-gutter">
              <SkeletonList count={3} />
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              className="border-0 rounded-none shadow-none"
              icon="storefront"
              title="No restaurants yet"
              hint="Add one to get started."
            />
          ) : (
            <ResponsiveDataTable columns={tableColumns} rows={recent} rowKey="_id" />
          )}
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="bg-surface border border-outline-variant rounded-xl p-gutter">
          <h4 className="font-label-lg text-label-lg text-primary mb-stack-md font-semibold">
            Assigned Managers
          </h4>
          {managersLoading && assignedManagers.length === 0 ? (
            <SkeletonList count={3} />
          ) : assignedManagers.length === 0 ? (
            <EmptyState
              className="border-0 p-6"
              icon="badge"
              title="No managers assigned"
              hint="Assign managers from the Managers directory."
            />
          ) : (
            <div className="space-y-4">
              {assignedManagers.slice(0, 6).map((m) => (
                <div key={m._id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-xs">
                    {m.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md font-semibold leading-tight truncate">{m.username}</p>
                    <p className="text-xs text-outline truncate">{m.assignedRestaurant?.name || 'Assigned'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            to="/managers"
            className="block w-full mt-6 py-2 border border-outline-variant rounded-lg font-label-md text-on-surface-variant hover:bg-surface-container transition-colors text-center"
          >
            Manage All Staff
          </Link>
        </ScrollReveal>
      </div>

      <ScrollReveal
        delay={0.12}
        className="bg-surface-container-low rounded-2xl p-6 sm:p-8 border border-outline-variant flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div>
          <h3 className="font-headline-lg text-headline-lg text-primary mb-2 font-bold">
            Grow your restaurant network
          </h3>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Add a new branch and assign a manager to start managing chefs, waiters, tables, and menus.
          </p>
        </div>
        <Link to="/restaurants/new">
          <AnimatedButton className="py-3 px-6">Add Restaurant</AnimatedButton>
        </Link>
      </ScrollReveal>
    </div>
  )
}

export default function SuperAdminDashboard() {
  return (
    <DashboardLayout
      title="Super Admin Dashboard"
      searchPlaceholder="Search systems..."
      showAdd
      addLabel="Add New"
      addPath="/restaurants/new"
    >
      <SuperAdminDashboardContent />
    </DashboardLayout>
  )
}
