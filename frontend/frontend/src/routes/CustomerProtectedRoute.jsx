import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function CustomerProtectedRoute({ children }) {
  const { token, customer, isAuthenticated } = useSelector((state) => state.customerAuth)

  if (!token || !customer || !isAuthenticated || customer.role !== 'customer') {
    return <Navigate to="/customer/login" replace />
  }

  return children ? children : <Outlet />
}
