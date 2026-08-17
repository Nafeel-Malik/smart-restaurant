import axiosInstance from './axiosInstance';

/** GET /users/managers */
export const getManagers = () => axiosInstance.get('/users/managers');

/** POST /users/managers */
export const createManager = (data) => axiosInstance.post('/users/managers', data);

/** PATCH /restaurants/:restaurantId/assign-manager */
export const assignManager = (restaurantId, managerId) => 
  axiosInstance.patch(`/restaurants/${restaurantId}/assign-manager`, { managerId });

/** PATCH /restaurants/:restaurantId/unassign-manager */
export const unassignManager = (restaurantId) => 
  axiosInstance.patch(`/restaurants/${restaurantId}/unassign-manager`);

/** PATCH /users/managers/:id */
export const updateManager = (id, data) => 
  axiosInstance.patch(`/users/managers/${id}`, data);

/** DELETE /users/managers/:id */
export const deleteManager = (id) => 
  axiosInstance.delete(`/users/managers/${id}`);
