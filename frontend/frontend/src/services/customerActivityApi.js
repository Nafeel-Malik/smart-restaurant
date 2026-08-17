import axiosInstance from './axiosInstance'

export const getActivitySummary = () => axiosInstance.get('/customer/activity/summary')
