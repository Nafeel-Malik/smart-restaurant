import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/layout/AppShell'
import { SUPER_ADMIN_NAV, BRANCH_MANAGER_NAV } from '../constants/navigation'
import { logout } from '../store/authSlice'

function restaurantNameOf(user) {
  if (!user?.assignedRestaurant) return null
  if (typeof user.assignedRestaurant === 'object') return user.assignedRestaurant.name || null
  return null
}

/**
 * Superadmin + Branch Manager pages wrap content in this layout.
 * Thin adapter around the shared AppShell — portal-specific config only.
 */
export default function DashboardLayout({
  variant = 'super-admin',
  title,
  subtitle,
  searchPlaceholder,
  onSearch,
  showAdd,
  addLabel,
  addPath,
  onAdd,
  user,
  children,
}) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const authUser = useSelector((state) => state.auth.user)
  const isManager = variant === 'branch-manager'

  const displayUser = user || (authUser
    ? {
        name: authUser.username,
        role: authUser.role === 'super_admin' ? 'Super Admin' : 'Branch Manager',
        avatar: null,
      }
    : {
        name: isManager ? 'Branch Manager' : 'Super Admin',
        role: isManager ? 'Branch Manager' : 'Super Admin',
        avatar: null,
      })

  const resolvedSubtitle =
    subtitle ||
    (isManager && restaurantNameOf(authUser)
      ? `Assigned: ${restaurantNameOf(authUser)}`
      : undefined)

  const handleAdd = () => {
    if (onAdd) onAdd()
    else if (addPath) navigate(addPath)
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate(isManager ? '/branch-login' : '/login')
  }

  return (
    <AppShell
      navItems={isManager ? BRANCH_MANAGER_NAV : SUPER_ADMIN_NAV}
      portalLabel={isManager ? 'Manager Portal' : 'Super Admin'}
      homePath={isManager ? '/branch' : '/dashboard'}
      user={displayUser}
      onLogout={handleLogout}
      title={title}
      subtitle={resolvedSubtitle}
      searchPlaceholder={searchPlaceholder || 'Search...'}
      onSearch={onSearch}
      showSearch
      showAdd={showAdd}
      addLabel={addLabel}
      onAdd={handleAdd}
    >
      {children}
    </AppShell>
  )
}
