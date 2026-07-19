import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Home } from './pages/Home'
import { Checker } from './pages/Checker'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900 text-white">
          <nav className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="container mx-auto flex flex-wrap justify-between items-center gap-3">
              <h1 className="text-xl font-bold text-white">Netflix Cookie Manager</h1>
              <div className="flex items-center gap-4">
                <Link to="/" className="text-gray-300 hover:text-white text-sm transition-colors">Home</Link>
                <Link to="/checker" className="text-gray-300 hover:text-white text-sm transition-colors">Checker</Link>
                <span className="text-sm text-gray-400">🔵 LIVE</span>
                <span className="text-sm text-gray-400">📊 259 cookies</span>
              </div>
            </div>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checker" element={<Checker />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
