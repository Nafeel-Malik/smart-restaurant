import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppRoutes from './routes'
import { fetchProfile } from './store/authSlice'
import { fetchCurrentCustomer } from './store/customerAuthSlice'
import './assets/styles/index.css'

export default function App() {
  const dispatch = useDispatch()
  const token = useSelector((state) => state.auth.token)
  const customerToken = useSelector((state) => state.customerAuth.token)

  useEffect(() => {
    if (token) {
      dispatch(fetchProfile())
    }
  }, [dispatch, token])

  useEffect(() => {
    if (customerToken) {
      dispatch(fetchCurrentCustomer())
    }
  }, [dispatch, customerToken])

  return <AppRoutes />
}
