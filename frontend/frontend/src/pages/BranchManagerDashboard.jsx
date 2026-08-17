import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import ResponsiveDataTable from '../components/tables/ResponsiveDataTable'
import { GRID, STAT_BODY, STAT_LABEL } from '../constants/breakpoints'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  EmptyState,
  MotionBanner,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { fetchChefs } from '../store/chefSlice'
import { fetchWaiters } from '../store/waiterSlice'
import { fetchTables } from '../store/tableSlice'
import { fetchCategories } from '../store/categorySlice'
import { fetchMenuItems } from '../store/menuItemSlice'

const staffColumns = [
  { key: 'name', label: 'Name', render: (m) => m.name },
  { key: 'role', label: 'Role', hideOnTablet: true, render: (m) => m.role },
  { key: 'hours', label: 'Hours', hideOnTablet: true, render: (m) => m.hours },
]

const statIconStyles = [
  'bg-primary-container text-on-primary-container',
  'bg-secondary-container text-on-secondary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-surface-variant text-on-surface',
]

const valueColors = ['text-primary', 'text-secondary', 'text-tertiary', 'text-on-surface']

export function BranchManagerDashboardContent() {
  usePageTitle('Branch Dashboard')
  const dispatch = useDispatch()
  const chefs = useSelector((state) => state.chefs.list)
  const waiters = useSelector((state) => state.waiters.list)
  const tables = useSelector((state) => state.tables.list)
  const categories = useSelector((state) => state.categories.list)
  const menuItems = useSelector((state) => state.menuItems.list)
  const user = useSelector((state) => state.auth.user)

  useEffect(() => {
    dispatch(fetchChefs())
    dispatch(fetchWaiters())
    dispatch(fetchTables())
    dispatch(fetchCategories())
    dispatch(fetchMenuItems())
  }, [dispatch])

  const restaurantName =
    typeof user?.assignedRestaurant === 'object' ? user.assignedRestaurant?.name : null

  const staff = [
    ...chefs.map((c) => ({ id: c._id, name: c.name, role: 'Chef', hours: `${c.timeIn} – ${c.timeOut}` })),
    ...waiters.map((w) => ({ id: w._id, name: w.name, role: 'Waiter', hours: `${w.timeIn} – ${w.timeOut}` })),
  ]

  const stats = [
    { label: 'Chefs', value: chefs.length, icon: 'chef_hat', note: 'Kitchen team' },
    { label: 'Waiters', value: waiters.length, icon: 'person', note: 'Floor staff' },
    { label: 'Tables', value: tables.length, icon: 'table_restaurant', note: `${tables.filter((t) => t.assignedWaiter).length} assigned` },
    { label: 'Menu Items', value: menuItems.length, icon: 'restaurant_menu', note: `${categories.length} categories` },
  ]

  return (
    <div className="space-y-stack-lg relative pb-20">
      {!user?.assignedRestaurant && (
        <MotionBanner type="error">
          You are not assigned to a restaurant yet. Ask a super admin to assign you before managing staff and menu.
        </MotionBanner>
      )}

      <AnimatedCardGrid className={`${GRID.stats} gap-stack-lg`}>
        {stats.map((stat, i) => (
          <AnimatedCard
            key={stat.label}
            staggerChild
            className="p-stack-lg flex items-center gap-4 !bg-surface-container-lowest card-elevation border-0"
          >
            <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center ${statIconStyles[i]}`}>
              <Icon name={stat.icon} size={28} />
            </div>
            <div className={STAT_BODY}>
              <p className={STAT_LABEL}>{stat.label}</p>
              <h3 className={`font-numeral-lg text-numeral-lg ${valueColors[i]}`}>{stat.value}</h3>
              <p className="font-label-md text-label-md text-on-surface-variant">{stat.note}</p>
            </div>
          </AnimatedCard>
        ))}
      </AnimatedCardGrid>

      <div className="grid grid-cols-12 gap-stack-lg">
        <AnimatedCard className="col-span-12 lg:col-span-8 !bg-surface-container-lowest card-elevation border-0 p-stack-lg">
          <div className="flex justify-between items-center mb-stack-md flex-wrap gap-3">
            <h4 className="font-headline-sm text-headline-sm">Staff Overview</h4>
            <Link to="/chefs">
              <AnimatedButton className="!py-2">
                <Icon name="add" size={16} />
                Manage Staff
              </AnimatedButton>
            </Link>
          </div>
          {staff.length === 0 ? (
            <EmptyState
              icon="group"
              title="No staff yet"
              hint="Add chefs and waiters to see them here."
            />
          ) : (
            <ResponsiveDataTable columns={staffColumns} rows={staff.slice(0, 8)} rowKey="id" />
          )}
        </AnimatedCard>

        <div className="col-span-12 lg:col-span-4 space-y-stack-lg">
          <AnimatedCard className="!bg-surface-container-lowest card-elevation border-0 p-stack-md">
            <h5 className={`${STAT_LABEL} mb-stack-sm`}>
              Categories
            </h5>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <span className="text-sm text-on-surface-variant">No categories yet</span>
              ) : categories.map((cat) => (
                <span key={cat._id} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-container text-on-primary-container">
                  {cat.name}
                </span>
              ))}
            </div>
          </AnimatedCard>

          <AnimatedCard className="!bg-primary !text-white border-0 p-stack-lg shadow-lg">
            <p className="font-label-md uppercase opacity-80">Branch</p>
            <h4 className="font-headline-sm text-white">{restaurantName || 'Unassigned'}</h4>
            <p className="text-xs mt-2 text-primary-fixed">{tables.length} tables · {menuItems.length} menu items</p>
          </AnimatedCard>
        </div>
      </div>

      {tables.length === 0 ? (
        <EmptyState icon="table_restaurant" title="No tables yet" hint="Add tables from Tables Management." />
      ) : (
        <AnimatedCardGrid className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-stack-md">
          {tables.map((table) => (
            <AnimatedCard
              key={table._id}
              staggerChild
              className="flex flex-col items-center justify-center p-stack-md !bg-surface"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${table.assignedWaiter ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                <Icon name="table_restaurant" size={20} />
              </div>
              <span className="font-label-lg">{table.number}</span>
              <span className="text-[10px] uppercase font-bold tracking-tighter opacity-70">
                {table.assignedWaiter?.name || 'Open'}
              </span>
            </AnimatedCard>
          ))}
        </AnimatedCardGrid>
      )}
    </div>
  )
}

export default function BranchManagerDashboard() {
  return (
    <DashboardLayout
      variant="branch-manager"
      title="Branch Dashboard"
      searchPlaceholder="Search operations..."
    >
      <BranchManagerDashboardContent />
    </DashboardLayout>
  )
}
