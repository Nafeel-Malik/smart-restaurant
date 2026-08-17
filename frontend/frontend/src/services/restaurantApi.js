import axiosInstance from './axiosInstance';

/** GET /restaurants */
export const getRestaurants = () => axiosInstance.get('/restaurants');

/** POST /restaurants */
export const createRestaurant = (data) => axiosInstance.post('/restaurants', data);

/** PATCH /restaurants/:id */
export const updateRestaurant = (id, data) => axiosInstance.patch(`/restaurants/${id}`, data);

/** DELETE /restaurants/:id */
export const deleteRestaurant = (id) => axiosInstance.delete(`/restaurants/${id}`);
