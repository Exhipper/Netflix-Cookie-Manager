import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// API functions
const fetchCookies = async () => {
  const res = await axios.get(`${API_BASE}/api/v1/cookies`)
  return res.data
}

const fetchStats = async () => {
  const res = await axios.get(`${API_BASE}/api/v1/stats`)
  return res.data
}

export const Home = () => {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All Plans')
  const [sort, setSort] = useState('newest')
  const [showModal, setShowModal] = useState(false)
  const [cookieInput, setCookieInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  const { data: cookiesData, isLoading: cookiesLoading, refetch: refetchCookies } = useQuery({
    queryKey: ['cookies'],
    queryFn: fetchCookies
  })

  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  })

  const handleSubmitCookie = async () => {
    if (!cookieInput.trim()) {
      setSubmitMessage('Please paste a cookie')
      return
    }

    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const res = await axios.post(`${API_BASE}/api/v1/cookies`, {
        cookie: cookieInput
      })
      
      if (res.data.message) {
        setSubmitMessage('✅ Cookie added successfully!')
        setCookieInput('')
        refetchCookies()
        setTimeout(() => setShowModal(false), 2000)
      }
    } catch (err) {
      setSubmitMessage('❌ Error: ' + (err.response?.data?.detail || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  const plans = ['All Plans', 'Premium', 'Standard', 'Basic', 'Standard with Ads']
  
  const cookies = cookiesData?.cookies || []
  const total = cookiesData?.total || 0

  // Filter and search
  const filteredCookies = cookies.filter(c => {
    const matchesSearch = 
      String(c.id).includes(search) ||
      c.plan?.toLowerCase().includes(search.toLowerCase()) ||
      c.country?.toLowerCase().includes(search.toLowerCase())
    
    const matchesFilter = filter === 'All Plans' || c.plan === filter
    
    return matchesSearch && matchesFilter
  })

  // Sort
  const sortedCookies = [...filteredCookies].sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at)
    } else {
      return new Date(a.created_at) - new Date(b.created_at)
    }
  })

  if (cookiesLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-gray-400">
        <div className="animate-pulse">Loading cookies...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{statsData?.total_cookies || 0}</div>
          <div className="text-xs text-gray-400">Total Cookies</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{statsData?.live_cookies || 0}</div>
          <div className="text-xs text-gray-400">Live</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{statsData?.online_now || 0}</div>
          <div className="text-xs text-gray-400">Online Now</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{statsData?.total_contributors || 0}</div>
          <div className="text-xs text-gray-400">Contributors</div>
        </div>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search ID, Name, Plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          {plans.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          + Add Cookie
        </button>
      </div>

      {/* Cookie Grid */}
      {sortedCookies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No cookies found. Click "Add Cookie" to submit one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedCookies.map(cookie => (
            <div 
              key={cookie.id} 
              className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs text-gray-500">#{cookie.id}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  cookie.status === 'live' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {cookie.status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
              <h3 className="text-white font-semibold mt-2">{cookie.plan || 'Unknown Plan'}</h3>
              <p className="text-gray-400 text-sm mt-1">Country: {cookie.country || 'N/A'}</p>
              {cookie.screen_count && (
                <p className="text-gray-400 text-sm">Screens: {cookie.screen_count}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                Added: {new Date(cookie.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Cookie Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Netflix Cookie</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Paste Cookie Data</label>
                <textarea
                  className="w-full h-32 bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Paste your Netflix cookie here... Supports Netscape, JSON, or Header format"
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                />
              </div>

              <div className="text-xs text-gray-500">
                Supported formats: Netscape (tab-separated), JSON (array or object), Header string (name=value; ...)
              </div>

              {submitMessage && (
                <div className={`p-3 rounded-lg text-sm ${
                  submitMessage.includes('✅') ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                }`}>
                  {submitMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitCookie}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Validating...' : 'Validate & Add'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
