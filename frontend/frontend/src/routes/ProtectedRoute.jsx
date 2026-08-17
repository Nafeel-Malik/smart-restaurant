import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ requiredRole, children }) {
  const { token, user } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to={requiredRole === 'super_admin' ? '/login' : '/branch-login'} replace />;
  }

  if (user.role !== requiredRole) {
    return <Navigate to={requiredRole === 'super_admin' ? '/login' : '/branch-login'} replace />;
  }

  return children ? children : <Outlet />;
}
