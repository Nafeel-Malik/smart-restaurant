import axiosInstance from './axiosInstance';

export const getChefs = () => axiosInstance.get('/chefs');
export const createChef = (data) => axiosInstance.post('/chefs', data);
export const updateChef = (id, data) => axiosInstance.patch(`/chefs/${id}`, data);
export const deleteChef = (id) => axiosInstance.delete(`/chefs/${id}`);
