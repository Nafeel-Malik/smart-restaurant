import axiosInstance from './axiosInstance'

export const getFavoriteRestaurants = () =>
  axiosInstance.get('/customer/favorites/restaurants')

export const addFavoriteRestaurant = (restaurantId) =>
  axiosInstance.post(`/customer/favorites/restaurants/${restaurantId}`)

export const removeFavoriteRestaurant = (restaurantId) =>
  axiosInstance.delete(`/customer/favorites/restaurants/${restaurantId}`)

export const checkFavoriteRestaurant = (restaurantId) =>
  axiosInstance.get(`/customer/favorites/restaurants/${restaurantId}/check`)

export const getFavoriteFood = () =>
  axiosInstance.get('/customer/favorites/food')

export const addFavoriteFood = (foodId) =>
  axiosInstance.post(`/customer/favorites/food/${foodId}`)

export const removeFavoriteFood = (foodId) =>
  axiosInstance.delete(`/customer/favorites/food/${foodId}`)

export const checkFavoriteFood = (foodId) =>
  axiosInstance.get(`/customer/favorites/food/${foodId}/check`)
