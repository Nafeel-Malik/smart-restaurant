import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import { PageHeader } from '../components/common'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { logout } from '../store/authSlice'

export default function Settings() {
  usePageTitle('Settings')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const restaurantName =
    typeof user?.assignedRestaurant === 'object' ? user.assignedRestaurant?.name : null

  const handleLogout = () => {
    dispatch(logout())
    navigate('/branch-login')
  }

  return (
    <DashboardLayout variant="branch-manager" title="Settings" searchPlaceholder="Search settings...">
      <PageHeader title="Account & Branch" subtitle="Your signed-in profile and assigned restaurant" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <div className="lg:col-span-7 space-y-stack-lg">
          <AnimatedCard className="p-6 space-y-stack-md">
            <div className="flex items-center gap-3 mb-2">
              <Icon name="person" className="text-primary" />
              <h2 className="font-headline-sm text-primary font-semibold">Profile</h2>
            </div>
            <AnimatedInput id="username" label="Username" value={user?.username || ''} readOnly />
            <AnimatedInput id="role" label="Role" value={user?.role === 'branch_manager' ? 'Branch Manager' : user?.role || ''} readOnly />
            <AnimatedInput id="restaurant" label="Assigned Restaurant" value={restaurantName || 'Not assigned'} readOnly />
          </AnimatedCard>
        </div>

        <div className="lg:col-span-5 space-y-stack-lg">
          <AnimatedCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon name="security" className="text-primary" />
              <h2 className="font-headline-sm text-primary font-semibold">Session</h2>
            </div>
            <AnimatedButton variant="ghost" className="w-full" onClick={handleLogout}>
              <Icon name="logout" size={18} />
              Logout
            </AnimatedButton>
          </AnimatedCard>

          <AnimatedCard className="!bg-primary !text-on-primary border-0 p-6">
            <h3 className="font-headline-sm font-semibold mb-2">RestoPro Suite</h3>
            <p className="text-sm opacity-90 mb-4">Connected to the NestJS + MongoDB backend.</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse" />
              API ready
            </div>
          </AnimatedCard>
        </div>
      </div>
    </DashboardLayout>
  )
}
