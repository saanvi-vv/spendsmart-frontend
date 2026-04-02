import axios from 'axios'

// This is your FastAPI backend URL
const BASE_URL = 'https://web-production-c58a.up.railway.app'

// axios.create() makes a reusable HTTP client
// Every request made with `api` will automatically go to BASE_URL
const api = axios.create({
  baseURL: BASE_URL,
})

// This is an interceptor — it runs before EVERY request
// It automatically adds the JWT token to every request header
// So you never have to manually add "Authorization: Bearer ..." everywhere
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------- Auth ----------

export const registerUser = (data) =>
  api.post('/auth/register', data)

export const loginUser = (data) =>
  api.post('/auth/login', data)

export const getMe = () =>
  api.get('/users/me')

// ---------- Expenses ----------

export const getExpenses = (params) =>
  api.get('/expenses', { params })

export const createExpense = (data) =>
  api.post('/expenses', data)

export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data)

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`)

// ---------- Summaries ----------

export const getSummaryByCategory = (params) =>
  api.get('/expenses/summary/by-category', { params })

export const getTotalSpending = (params) =>
  api.get('/expenses/summary/total', { params })

export const getMonthlySummary = (params) =>
  api.get('/expenses/summary/monthly', { params })