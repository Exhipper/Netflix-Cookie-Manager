import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { CookieChecker } from '../components/CookieChecker'

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

const generateAccount = async () => {
  const res = await axios.post(`${API_BASE}/api/v1/generate`)
  return res.data
}

const submitCookie = async (cookieData) => {
  const res = await axios.post(`${API_BASE}/api/v1/cookies`, { cookie: cookieData })
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAccount, setGeneratedAccount] = useState(null)
  const [showNFToken, setShowNFToken] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)

  const queryClient = useQueryClient()

  const { data: cookiesData, isLoading: cookiesLoading } = useQuery({
    queryKey: ['cookies'],
    queryFn: fetchCookies
  })

  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats
  })

  // Generate account mutation
  const generateMutation = useMutation({
    mutationFn: generateAccount,
    onSuccess: (data) => {
      setGeneratedAccount(data)
      setShowNFToken(true)
      setIsGenerating(false)
      queryClient.invalidateQueries(['cookies'])
      queryClient.invalidateQueries(['stats'])
    },
    onError: (error) => {
      setIsGenerating(false)
      setSubmitMessage('❌ Error generating account: ' + error.message)
    }
  })

  const handleGenerateAccount = () => {
    setIsGenerating(true)
    setGeneratedAccount(null)
    setShowNFToken(false)
    generateMutation.mutate()
  }

  const handleSubmitCookie = async () => {
    if (!cookieInput.trim()) {
      setSubmitMessage('Please paste a cookie')
      return
    }

    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const res = await submitCookie(cookieInput)
      if (res.data.message) {
        setSubmitMessage('✅ Cookie added successfully!')
        setCookieInput('')
        queryClient.invalidateQueries(['cookies'])
        queryClient.invalidateQueries(['stats'])
        setTimeout(() => setShowModal(false), 2000)
      }
    } catch (err) {
      setSubmitMessage('❌ Error: ' + (err.response?.data?.detail || err.message))
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const plans = ['All Plans', 'Premium', 'Standard', 'Basic', 'Standard with Ads']
  const cookies = cookiesData?.cookies || []

  const filteredCookies = cookies.filter(c => {
    const matchesSearch = 
      String(c.id).includes(search) ||
      c.plan?.toLowerCase().includes(search.toLowerCase()) ||
      c.country?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'All Plans' || c.plan === filter
    return matchesSearch && matchesFilter
  })

  const sortedCookies = [...filteredCookies].sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at)
    } else {
      return new Date(a.created_at) - new Date(b.created_at)
    }
  })

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries(['cookies'])
      queryClient.invalidateQueries(['stats'])
    }, 30000)
    return () => clearInterval(interval)
  }, [queryClient])

  if (cookiesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black">
      {/* Netflix-style header glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>

      <div className="container mx-auto px-4 py-6">
        {/* Generate Account Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-8"
        >
          <div className="bg-gradient-to-r from-red-900/30 to-black/50 rounded-2xl p-6 border border-red-800/30 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-red-500">🎬</span> Generate Netflix Account
                </h2>
                <p className="text-gray-400 text-sm mt-1">Generate a random account with NFToken for quick login</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerateAccount}
                disabled={isGenerating}
                className="px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all duration-300 shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>🎯</span> Generate Account
                  </>
                )}
              </motion.button>
            </div>

            {/* NFToken Result */}
            <AnimatePresence>
              {showNFToken && generatedAccount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 text-xl">✅</span>
                          <span className="text-white font-bold">Account Generated!</span>
                          <span className="text-sm text-gray-400">• {generatedAccount.plan}</span>
                          <span className="text-sm text-gray-400">• {generatedAccount.country}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <code className="bg-black/50 px-3 py-1 rounded text-sm text-green-300 font-mono break-all">
                            {generatedAccount.nftoken}
                          </code>
                          <button
                            onClick={() => copyToClipboard(generatedAccount.nftoken)}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
                          >
                            {copiedToken ? '✅ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Login Links */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={generatedAccount.login_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs text-white font-medium transition-colors"
                      >
                        📱 Mobile Login
                      </a>
                      <a
                        href={generatedAccount.login_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white font-medium transition-colors"
                      >
                        💻 PC Login
                      </a>
                      <a
                        href={generatedAccount.login_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs text-white font-medium transition-colors"
                      >
                        📺 TV Login
                      </a>
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      <p>💡 Click any login button to open Netflix with this account</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Cookie Checker Section */}
        <div className="mb-8">
          <CookieChecker />
        </div>

        {/* Stats Bar with animations */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: 'Total Cookies', value: statsData?.total_cookies || 0, color: 'text-white', icon: '🍪' },
            { label: 'Live', value: statsData?.live_cookies || 0, color: 'text-green-500', icon: '🟢' },
            { label: 'Online Now', value: statsData?.online_now || 0, color: 'text-blue-400', icon: '👤' },
            { label: 'Contributors', value: statsData?.total_contributors || 0, color: 'text-yellow-400', icon: '⭐' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -2 }}
              className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl p-4 text-center border border-gray-800/50 backdrop-blur-sm"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <motion.div
                key={stat.value}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`text-2xl font-bold ${stat.color}`}
              >
                {stat.value}
              </motion.div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Search & Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search ID, Name, Plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            {plans.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-red-600/30 flex items-center gap-2"
          >
            <span>➕</span> Add Cookie
          </button>
        </div>

        {/* Cookie Grid with animations */}
        {sortedCookies.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-xl">No cookies found</p>
            <p className="text-sm mt-2">Click "Generate Account" or "Add Cookie" to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedCookies.map((cookie, index) => (
              <motion.div
                key={cookie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl p-4 border border-gray-800/50 hover:border-red-700/50 transition-all duration-300 backdrop-blur-sm group"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">#{cookie.id}</span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cookie.status === 'live' 
                        ? 'bg-green-600/80 text-green-200 animate-pulse' 
                        : 'bg-red-600/80 text-red-200'
                    }`}
                  >
                    {cookie.status?.toUpperCase() || 'PENDING'}
                  </motion.span>
                </div>
                <h3 className="text-white font-semibold mt-2 text-lg">{cookie.plan || 'Unknown Plan'}</h3>
                <p className="text-gray-400 text-sm mt-1">Country: {cookie.country || 'N/A'}</p>
                {cookie.screen_count && (
                  <p className="text-gray-400 text-sm">Screens: {cookie.screen_count}</p>
                )}
                {cookie.quality && (
                  <p className="text-gray-400 text-sm">Quality: {cookie.quality}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Added: {new Date(cookie.created_at).toLocaleDateString()}
                </p>
                {cookie.expiry_date && (
                  <p className="text-gray-500 text-xs">
                    Expires: {new Date(cookie.expiry_date).toLocaleDateString()}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Cookie Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-gradient-to-b from-gray-900 to-black rounded-2xl max-w-lg w-full p-6 border border-gray-800/50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">🎬 Add Netflix Cookie</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Paste Cookie Data</label>
                    <textarea
                      className="w-full h-32 bg-black/50 text-white rounded-lg p-3 border border-gray-700 focus:outline-none focus:border-red-500 resize-none font-mono text-sm"
                      placeholder="Paste your Netflix cookie here..."
                      value={cookieInput}
                      onChange={(e) => setCookieInput(e.target.value)}
                    />
                  </div>

                  <div className="text-xs text-gray-500">
                    Supported formats: Netscape (tab-separated), JSON, Header string
                  </div>

                  {submitMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg text-sm ${
                        submitMessage.includes('✅') 
                          ? 'bg-green-900/50 border border-green-700/50 text-green-400' 
                          : 'bg-red-900/50 border border-red-700/50 text-red-400'
                      }`}
                    >
                      {submitMessage}
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmitCookie}
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-all duration-300 shadow-lg shadow-red-600/30"
                    >
                      {isSubmitting ? 'Validating...' : 'Validate & Add'}
                    </motion.button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
