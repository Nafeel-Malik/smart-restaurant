import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

const isCustomerApi = (url = '') => String(url).includes('/customer/')

axiosInstance.interceptors.request.use(
  (config) => {
    const token = isCustomerApi(config.url)
      ? localStorage.getItem('customerToken')
      : localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type')
      } else if (config.headers) {
        delete config.headers['Content-Type']
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      const requestUrl = error.config?.url || ''
      const customerRequest = isCustomerApi(requestUrl)

      if (customerRequest) {
        localStorage.removeItem('customerToken')
        localStorage.removeItem('customer')
        const onCustomerAuthPage =
          path.startsWith('/customer/login') || path.startsWith('/customer/register')
        if (path.startsWith('/customer') && !onCustomerAuthPage) {
          window.location.replace('/customer/login')
        }
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        const onLoginPage = path.includes('login')
        if (!onLoginPage && !path.startsWith('/customer')) {
          const isBranch =
            path.startsWith('/branch') ||
            ['/chefs', '/waiters', '/tables', '/categories', '/menu', '/settings'].some((p) =>
              path.startsWith(p)
            )
          window.location.replace(isBranch ? '/branch-login' : '/login')
        }
      }
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
