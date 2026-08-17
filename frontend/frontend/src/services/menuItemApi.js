import axiosInstance from './axiosInstance';

export const getMenuItems = (categoryId) =>
  axiosInstance.get('/menu-items', categoryId ? { params: { category: categoryId } } : undefined);
export const createMenuItem = (data) => axiosInstance.post('/menu-items', data);
export const updateMenuItem = (id, data) => axiosInstance.patch(`/menu-items/${id}`, data);
export const deleteMenuItem = (id) => axiosInstance.delete(`/menu-items/${id}`);
