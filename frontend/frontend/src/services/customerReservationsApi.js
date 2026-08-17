import axiosInstance from './axiosInstance'

export const getAvailableSlots = (restaurantId, date, partySize) =>
  axiosInstance.get(`/customer/restaurants/${restaurantId}/available-slots`, {
    params: {
      date,
      ...(partySize ? { partySize } : {}),
    },
  })

export const createReservation = (data) => axiosInstance.post('/customer/reservations', data)

export const getMyReservations = (params = {}) => {
  const query = {}
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query[key] = value
  })
  return axiosInstance.get('/customer/reservations', { params: query })
}

export const getReservation = (id) => axiosInstance.get(`/customer/reservations/${id}`)

export const cancelReservationApi = (id) => axiosInstance.patch(`/customer/reservations/${id}/cancel`)

export const getPreOrder = (reservationId) =>
  axiosInstance.get(`/customer/reservations/${reservationId}/pre-order`)

export const createPreOrderApi = (reservationId, data) =>
  axiosInstance.post(`/customer/reservations/${reservationId}/pre-order`, data)

export const updatePreOrderApi = (reservationId, data) =>
  axiosInstance.patch(`/customer/reservations/${reservationId}/pre-order`, data)

export const cancelPreOrderApi = (reservationId) =>
  axiosInstance.delete(`/customer/reservations/${reservationId}/pre-order`)
