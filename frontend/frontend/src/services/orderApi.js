import axiosInstance from './axiosInstance'

export const getStaffOrders = (restaurantId) =>
  axiosInstance.get('/orders', { params: restaurantId ? { restaurantId } : undefined })

export const getStaffOrder = (id) => axiosInstance.get(`/orders/${id}`)

export const updateStaffOrderStatus = (id, status) =>
  axiosInstance.patch(`/orders/${id}/status`, { status })
