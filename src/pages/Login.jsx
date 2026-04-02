import { useState } from 'react'
import { loginUser } from '../api'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  // State for form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // State for loading and errors
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // useNavigate lets us redirect to another page programmatically
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault() // prevents page refresh on form submit
    setLoading(true)
    setError('')

    try {
      const response = await loginUser({ email, password })

      // Save token to localStorage — stays there even after browser closes
      localStorage.setItem('token', response.data.access_token)

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      // Show error message if login fails
      setError(err.response?.data?.detail || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-400">💰 SpendSmart</h1>
          <p className="text-gray-400 mt-2">Track your expenses smartly</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
          <h2 className="text-2xl font-semibold text-white mb-6">Welcome back</h2>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                required
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-white font-semibold py-3 rounded-lg transition mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:text-emerald-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}