import axiosInstance from './axiosInstance'

export const getEmailConfig = () => axiosInstance.get('/admin/settings/email')

export const updateEmailConfig = (data) => axiosInstance.put('/admin/settings/email', data)

export const sendTestEmail = (to) => axiosInstance.post('/admin/settings/email/test', { to })
