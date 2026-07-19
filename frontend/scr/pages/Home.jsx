import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://your-backend-url.fly.dev'

const fetchCookies = async () => {
  const res = await axios.get(`${API_BASE}/api/v1/cookies`)
  return res.data
}

export const Home = () => {
  const [search, setSearch] = useState('')
  const { data, isLoading, error } = useQuery({
    queryKey: ['cookies'],
    queryFn: fetchCookies
  })

  if (isLoading) return <div className="text-center p-8 text-gray-400">Loading cookies...</div>
  if (error) return <div className="text-center p-8 text-red-500">Error loading cookies</div>

  const cookies = data?.cookies || []
  const total = data?.total || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Netflix Cookies</h1>
          <p className="text-gray-400 text-sm">Total LIVE: {total}</p>
        </div>
        <input
          type="text"
          placeholder="Search ID, Name, Plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cookies.filter(c => 
          c.plan?.toLowerCase().includes(search.toLowerCase()) ||
          String(c.id).includes(search)
        ).map(cookie => (
          <div key={cookie.id} className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500">#{cookie.id}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                cookie.status === 'live' ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {cookie.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>
            <h3 className="text-white font-semibold mt-2">{cookie.plan || 'Unknown Plan'}</h3>
            <p className="text-gray-400 text-sm mt-1">Country: {cookie.country || 'N/A'}</p>
          </div>
        ))}
      </div>

      {cookies.length === 0 && (
        <div className="text-center p-12 text-gray-500">
          <p>No cookies available. Add some using the admin panel!</p>
        </div>
      )}
    </div>
  )
}
