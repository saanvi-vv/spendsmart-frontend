import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMe, getExpenses, createExpense,
  updateExpense, deleteExpense,
  getSummaryByCategory, getTotalSpending
} from '../api'
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

// Colors for pie chart slices
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// Categories the user can pick from
const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other']

export default function Dashboard() {
  const navigate = useNavigate()

  // User info
  const [user, setUser] = useState(null)

  // Expenses data
  const [expenses, setExpenses] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [total, setTotal] = useState(0)

  // Filters
  const [filterCategory, setFilterCategory] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  // Add expense form
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '', amount: '', category: 'Food', notes: ''
  })

  // Edit expense
  const [editingId, setEditingId] = useState(null)

  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Runs once when dashboard loads
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    loadData()
  }, [])

  // Runs whenever filters change
  useEffect(() => {
    loadExpenses()
    loadSummary()
  }, [filterCategory, filterMonth])

  const loadData = async () => {
    try {
      const [userRes, expensesRes, summaryRes, totalRes] = await Promise.all([
        getMe(),
        getExpenses({}),
        getSummaryByCategory({}),
        getTotalSpending({})
      ])
      setUser(userRes.data)
      setExpenses(expensesRes.data)
      setCategoryData(summaryRes.data)
      setTotal(totalRes.data.total)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      }
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadExpenses = async () => {
    try {
      const params = {}
      if (filterCategory) params.category = filterCategory
      if (filterMonth) params.month = filterMonth
      const res = await getExpenses(params)
      setExpenses(res.data)
    } catch (err) {
      setError('Failed to load expenses')
    }
  }

  const loadSummary = async () => {
    try {
      const params = {}
      if (filterMonth) params.month = filterMonth
      const [summaryRes, totalRes] = await Promise.all([
        getSummaryByCategory(params),
        getTotalSpending(params)
      ])
      setCategoryData(summaryRes.data)
      setTotal(totalRes.data.total)
    } catch (err) {
      setError('Failed to load summary')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        notes: formData.notes || null
      }

      if (editingId) {
        await updateExpense(editingId, data)
      } else {
        await createExpense(data)
      }

      // Reset form and reload
      setFormData({ title: '', amount: '', category: 'Food', notes: '' })
      setShowForm(false)
      setEditingId(null)
      loadData()
    } catch (err) {
      setError('Failed to save expense')
    }
  }

  const handleEdit = (expense) => {
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      notes: expense.notes || ''
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await deleteExpense(id)
      loadData()
    } catch (err) {
      setError('Failed to delete expense')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-emerald-400 text-xl">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-emerald-400">💰 SpendSmart</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">Hi, {user?.name} 👋</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Total Spent</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">₹{total.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Total Expenses</p>
            <p className="text-3xl font-bold text-white mt-1">{expenses.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Categories</p>
            <p className="text-3xl font-bold text-white mt-1">{categoryData.length}</p>
          </div>
        </div>

        {/* Chart + Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Pie Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600">
                No data yet
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Filter Expenses</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Month</label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Months</option>
                  {['January','February','March','April','May','June',
                    'July','August','September','October','November','December'
                  ].map((month, i) => (
                    <option key={month} value={i + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { setFilterCategory(''); setFilterMonth('') }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg transition text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Add Expense Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Expenses</h2>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ title: '', amount: '', category: 'Food', notes: '' }) }}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            {showForm ? 'Cancel' : '+ Add Expense'}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Expense' : 'New Expense'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Lunch"
                  required
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 250"
                  required
                  min="1"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Biryani from dhaba"
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-lg transition"
                >
                  {editingId ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Expense List */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {expenses.length === 0 ? (
            <div className="p-12 text-center text-gray-600">
              No expenses yet. Add your first one!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-800 text-gray-400 text-sm">
                <tr>
                  <th className="text-left px-6 py-4">Title</th>
                  <th className="text-left px-6 py-4">Category</th>
                  <th className="text-left px-6 py-4">Amount</th>
                  <th className="text-left px-6 py-4">Date</th>
                  <th className="text-left px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium">{expense.title}</p>
                      {expense.notes && (
                        <p className="text-gray-500 text-sm">{expense.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-400">
                      ₹{expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(expense.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1 rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}