import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const fetchAllCookies = async () => {
  const res = await axios.get(`${API_BASE}/api/v1/cookies?limit=1000`)
  return res.data
}

const recheckAllCookies = async () => {
  const res = await axios.post(`${API_BASE}/api/v1/cookies/recheck-all`)
  return res.data
}

const bulkAddCookies = async (cookieList) => {
  const res = await axios.post(`${API_BASE}/api/v1/cookies/bulk`, { cookies: cookieList })
  return res.data
}

export const Admin = () => {
  const [bulkInput, setBulkInput] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const [isBulkAdding, setIsBulkAdding] = useState(false)
  const [isRechecking, setIsRechecking] = useState(false)

  const queryClient = useQueryClient()

  const { data: cookiesData, isLoading } = useQuery({
    queryKey: ['admin-cookies'],
    queryFn: fetchAllCookies
  })

  const recheckMutation = useMutation({
    mutationFn: recheckAllCookies,
    onSuccess: (data) => {
      setIsRechecking(false)
      setBulkMessage('✅ ' + data.message)
      queryClient.invalidateQueries(['admin-cookies'])
      queryClient.invalidateQueries(['cookies'])
      queryClient.invalidateQueries(['stats'])
    },
    onError: (error) => {
      setIsRechecking(false)
      setBulkMessage('❌ Error: ' + error.message)
    }
  })

  const bulkMutation = useMutation({
    mutationFn: bulkAddCookies,
    onSuccess: (data) => {
      setIsBulkAdding(false)
      setBulkMessage('✅ ' + data.message)
      setBulkInput('')
      queryClient.invalidateQueries(['admin-cookies'])
      queryClient.invalidateQueries(['cookies'])
      queryClient.invalidateQueries(['stats'])
    },
    onError: (error) => {
      setIsBulkAdding(false)
      setBulkMessage('❌ Error: ' + error.message)
    }
  })

  const handleRecheckAll = () => {
    setIsRechecking(true)
    setBulkMessage('')
    recheckMutation.mutate()
  }

  const handleBulkAdd = () => {
    if (!bulkInput.trim()) {
      setBulkMessage('Please paste cookies')
      return
    }

    const cookieList = bulkInput.split('\n').filter(c => c.trim())
    if (cookieList.length === 0) {
      setBulkMessage('No valid cookies found')
      return
    }

    setIsBulkAdding(true)
    setBulkMessage('')
    bulkMutation.mutate(cookieList)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const cookies = cookiesData?.cookies || []
  const liveCount = cookiesData?.live || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-red-950 to-black p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <span className="text-xs bg-red-600 px-2 py-1 rounded-full text-white">🔒</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-900/80 rounded-xl p-4 border border-gray-800/50">
            <div className="text-2xl font-bold text-white">{cookies.length}</div>
            <div className="text-sm text-gray-400">Total Cookies</div>
          </div>
          <div className="bg-gray-900/80 rounded-xl p-4 border border-gray-800/50">
            <div className="text-2xl font-bold text-green-500">{liveCount}</div>
            <div className="text-sm text-gray-400">Live Cookies</div>
          </div>
        </div>

        {/* Bulk Add Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/80 rounded-xl p-6 border border-gray-800/50 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-2">Bulk Add Cookies</h2>
          <p className="text-sm text-gray-400 mb-4">Paste multiple cookies (one per line)</p>
          
          <textarea
            className="w-full h-40 bg-black/50 text-white rounded-lg p-3 border border-gray-700 focus:outline-none focus:border-red-500 resize-none font-mono text-sm"
            placeholder="Paste cookies here... one per line"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
          />

          <div className="flex gap-3 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBulkAdd}
              disabled={isBulkAdding}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-300"
            >
              {isBulkAdding ? 'Adding...' : 'Bulk Add'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRecheckAll}
              disabled={isRechecking}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all duration-300"
            >
              {isRechecking ? 'Rechecking...' : '🔄 Recheck All'}
            </motion.button>
          </div>

          {bulkMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-3 rounded-lg text-sm ${
                bulkMessage.includes('✅') 
                  ? 'bg-green-900/50 border border-green-700/50 text-green-400' 
                  : 'bg-red-900/50 border border-red-700/50 text-red-400'
              }`}
            >
              {bulkMessage}
            </motion.div>
          )}
        </motion.div>

        {/* Cookie List */}
        <div className="bg-gray-900/80 rounded-xl p-6 border border-gray-800/50">
          <h2 className="text-xl font-bold text-white mb-4">All Cookies</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 px-3">ID</th>
                  <th className="text-left py-2 px-3">Plan</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Country</th>
                  <th className="text-left py-2 px-3">Added</th>
                </tr>
              </thead>
              <tbody>
                {cookies.map((cookie) => (
                  <motion.tr
                    key={cookie.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-2 px-3 text-white">#{cookie.id}</td>
                    <td className="py-2 px-3 text-white">{cookie.plan}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cookie.status === 'live' ? 'bg-green-600/80 text-green-200' : 'bg-red-600/80 text-red-200'
                      }`}>
                        {cookie.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-300">{cookie.country}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs">
                      {new Date(cookie.created_at).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
