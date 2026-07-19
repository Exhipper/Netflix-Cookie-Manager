import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Home } from './pages/Home'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">Netflix Cookie Manager</h1>
          </div>
        </nav>
        <Home />
      </div>
    </QueryClientProvider>
  )
}

export default App
