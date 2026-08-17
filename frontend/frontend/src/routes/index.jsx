import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import AuthLayout from '../layouts/AuthLayout'
import CustomerAuthLayout from '../layouts/CustomerAuthLayout'
import StaffAuthLayout from '../layouts/StaffAuthLayout'
import CustomerLayout from '../layouts/CustomerLayout'
import ProtectedRoute from './ProtectedRoute'
import CustomerProtectedRoute from './CustomerProtectedRoute'

const SuperAdminLogin = lazy(() => import('../pages/SuperAdminLogin'))
const BranchManagerLogin = lazy(() => import('../pages/BranchManagerLogin'))
const CustomerLogin = lazy(() => import('../pages/CustomerLogin'))
const CustomerRegister = lazy(() => import('../pages/CustomerRegister'))
const CustomerVerifyOtp = lazy(() => import('../pages/CustomerVerifyOtp'))
const CustomerDashboard = lazy(() => import('../pages/CustomerDashboard'))
const CustomerProfile = lazy(() => import('../pages/CustomerProfile'))
const CustomerAddresses = lazy(() => import('../pages/CustomerAddresses'))
const CustomerFavorites = lazy(() => import('../pages/CustomerFavorites'))
const CustomerRestaurants = lazy(() => import('../pages/CustomerRestaurants'))
const CustomerRestaurantMenu = lazy(() => import('../pages/CustomerRestaurantMenu'))
const CustomerCart = lazy(() => import('../pages/CustomerCart'))
const CustomerOrders = lazy(() => import('../pages/CustomerOrders'))
const CustomerOrderDetail = lazy(() => import('../pages/CustomerOrderDetail'))
const CustomerActivityPage = lazy(() => import('../pages/CustomerActivityPage'))
const CustomerReservationPage = lazy(() => import('../pages/CustomerReservationPage'))
const CustomerReservationsPage = lazy(() => import('../pages/CustomerReservationsPage'))
const CustomerReservationDetail = lazy(() => import('../pages/CustomerReservationDetail'))
const CustomerPreOrderPage = lazy(() => import('../pages/CustomerPreOrderPage'))
const CustomerMyReviewsPage = lazy(() => import('../pages/CustomerMyReviewsPage'))
const CustomerStylePreview = lazy(() => import('../pages/CustomerStylePreview'))
const OrdersList = lazy(() => import('../pages/OrdersList'))
const SuperAdminDashboard = lazy(() => import('../pages/SuperAdminDashboard'))
const BranchManagerDashboard = lazy(() => import('../pages/BranchManagerDashboard'))
const RestaurantsList = lazy(() => import('../pages/RestaurantsList'))
const AddEditRestaurant = lazy(() => import('../pages/AddEditRestaurant'))
const ManagersList = lazy(() => import('../pages/ManagersList'))
const AssignManager = lazy(() => import('../pages/AssignManager'))
const ChefsList = lazy(() => import('../pages/ChefsList'))
const WaitersList = lazy(() => import('../pages/WaitersList'))
const TablesList = lazy(() => import('../pages/TablesList'))
const MenuCategories = lazy(() => import('../pages/MenuCategories'))
const MenuItems = lazy(() => import('../pages/MenuItems'))
const Settings = lazy(() => import('../pages/Settings'))
const EmailSettingsPage = lazy(() => import('../pages/EmailSettingsPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="font-label-md text-label-md text-on-surface-variant">Loading RestoPro…</p>
      </div>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>

          <Route element={<StaffAuthLayout portal="admin" />}>
            <Route path="/login" element={<SuperAdminLogin />} />
          </Route>
          <Route element={<StaffAuthLayout portal="manager" />}>
            <Route path="/branch-login" element={<BranchManagerLogin />} />
          </Route>

          {/* Customer auth — shared charcoal/ember shell + route crossfade */}
          <Route element={<CustomerAuthLayout />}>
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/register" element={<CustomerRegister />} />
            <Route path="/customer/verify-otp" element={<CustomerVerifyOtp />} />
          </Route>

          {/* Temporary motion DS playground — delete after customer rollout */}
          <Route path="/customer/_style-preview" element={<CustomerStylePreview />} />

          {/* Super Admin Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="super_admin" />}>
            <Route path="/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/restaurants" element={<RestaurantsList />} />
            <Route path="/restaurants/new" element={<AddEditRestaurant />} />
            <Route path="/restaurants/:id/edit" element={<AddEditRestaurant />} />
            <Route path="/managers" element={<ManagersList />} />
            <Route path="/managers/assign" element={<AssignManager />} />
            <Route path="/admin-orders" element={<OrdersList />} />
            <Route path="/admin-settings" element={<EmailSettingsPage />} />
          </Route>

          {/* Customer Protected Routes — shared sticky Home header via CustomerLayout */}
          <Route element={<CustomerProtectedRoute />}>
            <Route element={<CustomerLayout />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/profile" element={<CustomerProfile />} />
              <Route path="/customer/addresses" element={<CustomerAddresses />} />
              <Route path="/customer/favorites" element={<CustomerFavorites />} />
              <Route path="/customer/restaurants" element={<CustomerRestaurants />} />
              <Route path="/customer/restaurants/:id/reserve" element={<CustomerReservationPage />} />
              <Route path="/customer/restaurants/:id" element={<CustomerRestaurantMenu />} />
              <Route path="/customer/cart" element={<CustomerCart />} />
              <Route path="/customer/activity" element={<CustomerActivityPage />} />
              <Route path="/customer/reviews" element={<CustomerMyReviewsPage />} />
              <Route path="/customer/orders" element={<CustomerOrders />} />
              <Route path="/customer/orders/:id" element={<CustomerOrderDetail />} />
              <Route path="/customer/reservations" element={<CustomerReservationsPage />} />
              <Route path="/customer/reservations/:id/pre-order" element={<CustomerPreOrderPage />} />
              <Route path="/customer/reservations/:id" element={<CustomerReservationDetail />} />
            </Route>
          </Route>

          {/* Branch Manager Protected Routes */}
          <Route element={<ProtectedRoute requiredRole="branch_manager" />}>
            <Route path="/branch" element={<BranchManagerDashboard />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/chefs" element={<ChefsList />} />
            <Route path="/waiters" element={<WaitersList />} />
            <Route path="/tables" element={<TablesList />} />
            <Route path="/categories" element={<MenuCategories />} />
            <Route path="/menu" element={<MenuItems />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
