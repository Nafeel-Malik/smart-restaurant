import axiosInstance from './axiosInstance';

export const getTables = () => axiosInstance.get('/tables');
export const createTable = (data) => axiosInstance.post('/tables', data);
export const updateTable = (id, data) => axiosInstance.patch(`/tables/${id}`, data);
export const deleteTable = (id) => axiosInstance.delete(`/tables/${id}`);
export const assignTableWaiter = (id, waiterId) =>
  axiosInstance.patch(`/tables/${id}/assign-waiter`, { waiterId: waiterId || null });
