import React from 'react'
import { CookieChecker } from '../components/CookieChecker'

export const Checker = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Netflix Cookie Checker</h1>
        <p className="text-gray-400">Fast & Secure Validation</p>
      </div>
      <CookieChecker />
    </div>
  )
}
