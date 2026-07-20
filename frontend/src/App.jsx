import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Home } from './pages/Home'
import { Checker } from './pages/Checker'
import { Admin } from './pages/Admin'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900 text-white">
          <nav className="bg-gradient-to-r from-black to-gray-900 border-b border-gray-800 p-4 sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
            <div className="container mx-auto flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-2xl">▶</span>
                <h1 className="text-xl font-bold text-white">Netflix Cookie Manager</h1>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/" className="text-gray-300 hover:text-white text-sm transition-colors">Home</Link>
                <Link to="/checker" className="text-gray-300 hover:text-white text-sm transition-colors">Checker</Link>
                <Link to="/admin" className="text-gray-300 hover:text-white text-sm transition-colors">Admin</Link>
                <span className="text-sm text-green-400 animate-pulse">● LIVE</span>
              </div>
            </div>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checker" element={<Checker />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
