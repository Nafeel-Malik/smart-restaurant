import axiosInstance from './axiosInstance';

export const getWaiters = () => axiosInstance.get('/waiters');
export const createWaiter = (data) => axiosInstance.post('/waiters', data);
export const updateWaiter = (id, data) => axiosInstance.patch(`/waiters/${id}`, data);
export const deleteWaiter = (id) => axiosInstance.delete(`/waiters/${id}`);
export const assignWaiterTables = (id, tableIds) =>
  axiosInstance.patch(`/waiters/${id}/assign-tables`, { tableIds });
