'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [selectedAgent, setSelectedAgent] = useState('')
  const [customName, setCustomName] = useState('')
  const router = useRouter()

  const agents = [
    'Amber',
    'Ana',
    'Zara',
    'Munira',
    'Sana',
    'Tanya',
    'Tej',
    'Raabel',
    'Razia',
    'Shahnaz',
    'Other (Enter Name)'
  ]

  const handleContinue = () => {
    const agentName = selectedAgent === 'Other (Enter Name)' ? customName : selectedAgent
    
    if (agentName && agentName.trim() !== '') {
      // Store agent profile in localStorage
      localStorage.setItem('agentProfile', agentName)
      localStorage.setItem('agentLoginTime', new Date().toISOString())
      
      // Redirect to main app
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Company Branding - Top */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-black mb-2 tracking-tight">
            McKinney & Co.
          </h1>
          <p className="text-xl text-gray-500 font-light tracking-wide">
            Insurance
          </p>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-black mb-3 tracking-tight">
            Welcome
          </h2>
          <p className="text-gray-400 text-base font-light">
            Select your profile to continue
          </p>
        </div>

        {/* Agent Selection */}
        <div className="space-y-6">
          <div className="relative">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-6 py-5 text-lg bg-white border border-black text-black 
                       focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                       appearance-none cursor-pointer font-light transition-all
                       hover:bg-gray-50"
            >
              <option value="" disabled>
                Choose your profile
              </option>
              {agents.map((agent) => (
                <option key={agent} value={agent}>
                  {agent}
                </option>
              ))}
            </select>
            
            {/* Custom dropdown arrow */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Custom Name Input - Shows when "Other" is selected */}
          {selectedAgent === 'Other (Enter Name)' && (
            <div className="relative">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-6 py-5 text-lg bg-white border border-black text-black 
                         focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent
                         font-light transition-all hover:bg-gray-50"
              />
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selectedAgent || (selectedAgent === 'Other (Enter Name)' && !customName.trim())}
            className={`w-full py-5 text-lg font-light tracking-wide transition-all
                      ${(selectedAgent && (selectedAgent !== 'Other (Enter Name)' || customName.trim()))
                        ? 'bg-black text-white hover:bg-gray-800 cursor-pointer' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
          >
            Continue
          </button>
        </div>

        {/* Footer Text */}
        <div className="mt-16 text-center">
          <p className="text-xs text-gray-300 font-light tracking-wider">
            CONVENIENCE STORE APPLICATION SYSTEM
          </p>
        </div>
      </div>
    </div>
  )
}
