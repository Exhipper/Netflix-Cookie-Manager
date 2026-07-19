import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const CookieChecker = () => {
  const [cookieData, setCookieData] = useState('')
  const [format, setFormat] = useState('Netscape')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckCookie = async () => {
    if (!cookieData.trim()) {
      setError('Please paste a cookie')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await axios.post(`${API_BASE}/api/v1/cookies/validate`, {
        cookie: cookieData
      })

      if (res.data.valid) {
        setResult({
          valid: true,
          plan: res.data.plan,
          country: res.data.country,
          status: res.data.status,
          expiry: res.data.expiry,
          screens: res.data.screens,
          quality: res.data.quality,
          message: res.data.message
        })
      } else {
        setError(res.data.error || 'Invalid cookie')
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Validation failed')
    } finally {
      setLoading(false)
    }
  }

  const clearData = () => {
    setCookieData('')
    setResult(null)
    setError('')
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Netflix Cookie Checker</h2>
      <p className="text-gray-400 text-sm mb-4">
        Paste your Netflix cookie below to instantly validate its status and retrieve detailed account information.
      </p>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-gray-400">COOKIE DATA</label>
          <span className="text-sm text-gray-500">{cookieData.length} chars</span>
        </div>
        <textarea
          className="w-full h-40 bg-gray-900 text-white rounded-lg p-3 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
          placeholder="Paste your Netflix cookie here..."
          value={cookieData}
          onChange={(e) => setCookieData(e.target.value)}
        />
      </div>

      <div className="text-xs text-gray-500 mb-4">
        Supported formats:
        <ul className="list-disc list-inside ml-2">
          <li>Netscape (tab-separated)</li>
          <li>JSON (array or object)</li>
          <li>Header string (name=value; ...)</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['Netscape', 'JSON', 'Header'].map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              format === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={clearData}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          Upload File
        </button>
      </div>

      <button
        onClick={handleCheckCookie}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {loading ? 'Checking...' : 'Check Cookie'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && result.valid && (
        <div className="mt-4 p-4 bg-green-900/30 border border-green-700 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-green-400 font-semibold">✅ Valid Cookie</h3>
            <span className="text-xs text-gray-400">Plan: {result.plan}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">Country</div>
            <div className="text-white">{result.country || 'N/A'}</div>
            <div className="text-gray-400">Status</div>
            <div className="text-white">{result.status || 'N/A'}</div>
            <div className="text-gray-400">Expiry</div>
            <div className="text-white">{result.expiry || 'N/A'}</div>
            <div className="text-gray-400">Screens</div>
            <div className="text-white">{result.screens || 'N/A'}</div>
            <div className="text-gray-400">Quality</div>
            <div className="text-white">{result.quality || 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  )
}
