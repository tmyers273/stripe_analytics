import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { authStore } from '../../stores/authStore'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

type AuthTab = 'login' | 'register'

export const AuthPanel = observer(() => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    name: '',
    organizationName: '',
  })

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await authStore.login(loginForm.email, loginForm.password)
    } catch (error) {
      console.error(error)
    }
  }

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await authStore.register(registerForm)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="w-full h-screen flex bg-gray-50 relative">
      {/* Logo - Top left absolute */}
      <div className="absolute top-8 left-8 flex items-center gap-3 z-10">
        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
          {/* Blue clover/flower logo */}
          <circle cx="16" cy="10" r="5" fill="#2563eb"/>
          <circle cx="22" cy="16" r="5" fill="#2563eb"/>
          <circle cx="16" cy="22" r="5" fill="#2563eb"/>
          <circle cx="10" cy="16" r="5" fill="#2563eb"/>
          <circle cx="16" cy="16" r="3" fill="white"/>
        </svg>
        <span className="text-lg font-bold text-gray-900">Stripe Analytics</span>
      </div>

      {/* Left side - Login form */}
      <div className="w-1/2 flex flex-col items-center justify-center p-16 bg-white">
        <div className="w-full max-w-md">
          {/* Form content */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 text-center">Welcome Back</h1>
            <p className="text-gray-600 mb-10 text-center">Enter your email and password to access your account.</p>

            {authStore.error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {authStore.error}
              </div>
            )}

            {activeTab === 'login' && (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="login-email">
                    Email
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                    autoComplete="email"
                    disabled={authStore.isLoading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="login-password">
                    Password
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    required
                    autoComplete="current-password"
                    disabled={authStore.isLoading}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between mb-6">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Forgot your password?
                  </a>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-base"
                  type="submit"
                  disabled={authStore.isLoading}
                >
                  {authStore.isLoading ? 'Signing in…' : 'Log In'}
                </Button>

                <p className="text-center text-sm text-gray-600 mt-6">
                  Don't have an account? <button onClick={() => setActiveTab('register')} className="font-medium text-blue-600 hover:text-blue-700">Register Now</button>
                </p>
              </form>
            )}

            {activeTab === 'register' && (
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="register-name">
                    Full name
                  </label>
                  <Input
                    id="register-name"
                    placeholder="Jane Doe"
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                    autoComplete="name"
                    disabled={authStore.isLoading}
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="register-email">
                    Email
                  </label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                    autoComplete="email"
                    disabled={authStore.isLoading}
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="register-organization">
                    Organization name
                  </label>
                  <Input
                    id="register-organization"
                    placeholder="Acme Inc."
                    value={registerForm.organizationName}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, organizationName: event.target.value }))
                    }
                    required
                    disabled={authStore.isLoading}
                    className="border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="register-password">
                    Password
                  </label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                    }
                    required
                    autoComplete="new-password"
                    disabled={authStore.isLoading}
                    className="border-gray-300"
                  />
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-base"
                  type="submit"
                  disabled={authStore.isLoading}
                >
                  {authStore.isLoading ? 'Creating account…' : 'Create account'}
                </Button>

                <p className="text-center text-sm text-gray-600 mt-6">
                  Already have an account? <button onClick={() => setActiveTab('login')} className="font-medium text-blue-600 hover:text-blue-700">Sign In</button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Positioned absolutely */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center text-xs text-gray-500 pointer-events-none">
        <div className="w-1/2 flex items-center justify-between pr-8">
          <p>Copyright © 2025 Stripe Analytics</p>
          <a href="#" className="hover:text-gray-700 pointer-events-auto">Privacy Policy</a>
        </div>
      </div>

      {/* Right side - Promotional panel */}
      <div className="w-1/2 bg-white flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl shadow-2xl p-12 w-full h-full flex flex-col justify-center text-white relative overflow-hidden">
          {/* Background SVG designs */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#93c5fd', stopOpacity: 0.15 }} />
                <stop offset="100%" style={{ stopColor: '#60a5fa', stopOpacity: 0.08 }} />
              </linearGradient>
              <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#bfdbfe', stopOpacity: 0.12 }} />
                <stop offset="100%" style={{ stopColor: '#93c5fd', stopOpacity: 0.06 }} />
              </linearGradient>
            </defs>

            {/* Massive blob top right - extends beyond container */}
            <ellipse cx="110%" cy="-10%" rx="450" ry="380" fill="url(#grad1)" opacity="0.5"/>

            {/* Large organic shape bottom left */}
            <ellipse cx="-15%" cy="100%" rx="420" ry="350" fill="#93c5fd" opacity="0.12"/>

            {/* Huge circle middle right */}
            <circle cx="95%" cy="50%" r="320" fill="#bfdbfe" opacity="0.08"/>

            {/* Abstract curved blob shapes */}
            <path d="M -100 200 Q 150 100 300 250 T 500 150 L 500 0 L -100 0 Z" fill="url(#grad2)" opacity="0.15"/>

            {/* Large organic wave */}
            <path d="M -50 600 Q 200 450 450 550 T 800 500 L 800 800 L -50 800 Z" fill="#93c5fd" opacity="0.1"/>

            {/* Abstract organic shapes */}
            <ellipse cx="20%" cy="30%" rx="280" ry="180" fill="#93c5fd" opacity="0.06" transform="rotate(-25 200 300)"/>

            {/* Large flowing curve */}
            <path d="M 1000 0 Q 700 300 900 600 T 1000 1000" stroke="#93c5fd" strokeWidth="80" fill="none" opacity="0.08"/>

            {/* Abstract blob bottom right */}
            <ellipse cx="120%" cy="110%" rx="380" ry="320" fill="url(#grad1)" opacity="0.14"/>
          </svg>
          <h2 className="text-4xl font-bold mb-3 leading-tight">See the full picture of your revenue</h2>
          <p className="text-blue-100 mb-8 text-base">Stop digging through Stripe logs. Get the metrics you actually care about—subscription trends, churn, revenue growth—in one beautiful dashboard.</p>

          {/* Feature mockup cards */}
          <div className="space-y-3">
            <div className="bg-blue-600 bg-opacity-30 backdrop-blur-sm rounded-lg p-4 border border-blue-200 border-opacity-50">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-blue-200 rounded-lg flex items-center justify-center text-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <span className="font-semibold text-white text-sm">Revenue & Growth Metrics</span>
              </div>
              <p className="text-blue-100 text-xs ml-12">MRR, ARR, churn rate, and growth trends at a glance</p>
            </div>

            <div className="bg-blue-600 bg-opacity-30 backdrop-blur-sm rounded-lg p-4 border border-blue-200 border-opacity-50">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-blue-200 rounded-lg flex items-center justify-center text-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="font-semibold text-white text-sm">Customer Insights</span>
              </div>
              <p className="text-blue-100 text-xs ml-12">Understand customer segments and behavior patterns</p>
            </div>

            <div className="bg-blue-600 bg-opacity-30 backdrop-blur-sm rounded-lg p-4 border border-blue-200 border-opacity-50">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-blue-200 rounded-lg flex items-center justify-center text-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
                  </svg>
                </div>
                <span className="font-semibold text-white text-sm">Real-time Data Sync</span>
              </div>
              <p className="text-blue-100 text-xs ml-12">Your metrics update automatically—always current, always accurate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
