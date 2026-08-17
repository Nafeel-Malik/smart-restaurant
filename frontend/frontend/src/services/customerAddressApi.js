import axiosInstance from './axiosInstance'

export const getAddresses = () => axiosInstance.get('/customer/addresses')

export const getAddress = (id) => axiosInstance.get(`/customer/addresses/${id}`)

export const createAddress = (data) => axiosInstance.post('/customer/addresses', data)

export const updateAddress = (id, data) => axiosInstance.patch(`/customer/addresses/${id}`, data)

export const deleteAddress = (id) => axiosInstance.delete(`/customer/addresses/${id}`)

export const setDefaultAddress = (id) => axiosInstance.patch(`/customer/addresses/${id}/set-default`)
