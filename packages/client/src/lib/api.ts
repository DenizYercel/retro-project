import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_URL ?? '') + '/api/v1'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ??
      error?.response?.data?.message ??
      error?.message ??
      'Bir hata oluştu'
    return Promise.reject(new Error(message))
  }
)

export default api
