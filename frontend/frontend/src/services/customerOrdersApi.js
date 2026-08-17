import axiosInstance from './axiosInstance'

const cleanParams = (params = {}) => {
  const query = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query[key] = value
  })
  return query
}

export const placeCustomerOrder = (data) => axiosInstance.post('/customer/orders', data)

export const getCustomerOrders = (params = {}) =>
  axiosInstance.get('/customer/orders', { params: cleanParams(params) })

export const getCustomerOrder = (id) => axiosInstance.get(`/customer/orders/${id}`)

export const getCustomerOrderReceipt = (id) => axiosInstance.get(`/customer/orders/${id}/receipt`)

export const cancelCustomerOrder = (id) => axiosInstance.patch(`/customer/orders/${id}/cancel`)
