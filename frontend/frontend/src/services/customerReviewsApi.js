import axiosInstance from './axiosInstance'

const cleanParams = (params = {}) => {
  const query = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query[key] = value
  })
  return query
}

export const getEligibleReviews = (restaurantId) =>
  axiosInstance.get(`/customer/restaurants/${restaurantId}/eligible-reviews`)

export const createReviewApi = (data) => axiosInstance.post('/customer/reviews', data)

export const getMyReviews = () => axiosInstance.get('/customer/reviews')

export const updateReviewApi = (id, data) => axiosInstance.patch(`/customer/reviews/${id}`, data)

export const deleteReviewApi = (id) => axiosInstance.delete(`/customer/reviews/${id}`)

export const getRestaurantReviews = (restaurantId, params = {}) =>
  axiosInstance.get(`/restaurants/${restaurantId}/reviews`, { params: cleanParams(params) })
