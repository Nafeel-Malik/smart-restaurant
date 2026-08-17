import axiosInstance from './axiosInstance'

/** POST /customer/auth/register */
export const registerCustomerApi = (data) =>
  axiosInstance.post('/customer/auth/register', data)

/** POST /customer/auth/login */
export const loginCustomerApi = (data) =>
  axiosInstance.post('/customer/auth/login', data)

/** POST /customer/auth/verify-otp */
export const verifyOtpApi = (data) =>
  axiosInstance.post('/customer/auth/verify-otp', data)

/** POST /customer/auth/resend-otp */
export const resendOtpApi = (data) =>
  axiosInstance.post('/customer/auth/resend-otp', data)

/** GET /customer/auth/me */
export const getCurrentCustomerApi = () =>
  axiosInstance.get('/customer/auth/me')

/** GET /customer/profile */
export const getCustomerProfileApi = () =>
  axiosInstance.get('/customer/profile')

/** PATCH /customer/profile */
export const updateCustomerProfileApi = (data) =>
  axiosInstance.patch('/customer/profile', data)

/** PATCH /customer/profile/change-password */
export const changeCustomerPasswordApi = (data) =>
  axiosInstance.patch('/customer/profile/change-password', data)

/** POST /customer/profile/picture */
export const uploadCustomerPictureApi = (file) => {
  const formData = new FormData()
  formData.append('picture', file)
  return axiosInstance.post('/customer/profile/picture', formData)
}

export function resolveMediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
