import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getCookies = (params) => 
  apiClient.get('/cookies', { params })

export const validateCookie = (cookieData) => 
  apiClient.post('/cookies/validate', { cookie: cookieData })

export const submitCookie = (cookieData) => 
  apiClient.post('/cookies', { cookie: cookieData })

export const getStats = () => 
  apiClient.get('/stats')

export const generateNFToken = (cookieData) => 
  apiClient.post('/nftoken', { cookie: cookieData })

export default apiClient
