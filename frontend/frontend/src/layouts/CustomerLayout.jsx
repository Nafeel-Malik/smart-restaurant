import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/layout/AppShell'
import { CUSTOMER_NAV } from '../constants/navigation'
import { logoutCustomer } from '../store/customerAuthSlice'
import { selectCartCount } from '../store/customerCartSlice'
import { resolveMediaUrl } from '../services/customerAuthApi'
import Icon from '../components/ui/Icon'

/**
 * Customer authenticated shell — same AppShell as Superadmin/Manager,
 * configured with customer nav + logout. Replaces the old thin Home header.
 */
export default function CustomerLayout() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const customer = useSelector((state) => state.customerAuth.customer)
  const cartCount = useSelector(selectCartCount)

  const handleLogout = async () => {
    await dispatch(logoutCustomer())
    navigate('/customer/login')
  }

  return (
    <AppShell
      navItems={CUSTOMER_NAV}
      portalLabel="Customer Portal"
      homePath="/customer/dashboard"
      user={{
        name: customer?.fullName || 'Customer',
        role: 'Customer',
        avatar: customer?.profilePicture ? resolveMediaUrl(customer.profilePicture) : null,
      }}
      onLogout={handleLogout}
      searchPlaceholder="Search restaurants, orders…"
      showSearch
      actions={
        <button
          type="button"
          onClick={() => navigate('/customer/cart')}
          className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 text-on-surface-variant transition-colors hover:bg-surface-container"
          aria-label="Open cart"
          title="Cart"
        >
          <Icon name="shopping_cart" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-on-primary flex items-center justify-center">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </button>
      }
    >
      <Outlet />
    </AppShell>
  )
}
