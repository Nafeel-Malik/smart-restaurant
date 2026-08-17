import axiosInstance from './axiosInstance'

export const getCustomerRestaurants = (search = '') =>
  axiosInstance.get('/customer/restaurants', { params: search ? { search } : undefined })

export const getCustomerRestaurant = (id) =>
  axiosInstance.get(`/customer/restaurants/${id}`)

export const getCustomerRestaurantMenu = (id) =>
  axiosInstance.get(`/customer/restaurants/${id}/menu`)
