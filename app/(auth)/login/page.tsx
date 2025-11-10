'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const signupSuccess = searchParams.get('message') === 'signup_success'

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPendingScreen, setShowPendingScreen] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    setShowPendingScreen(false)

    try {
      // First, check user status
      const statusCheckResponse = await fetch('/api/auth/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      const statusResult = await statusCheckResponse.json()

      if (!statusCheckResponse.ok) {
        if (statusResult.status === 'PENDING') {
          // Show pending approval screen
          setShowPendingScreen(true)
          setUserInfo({
            name: statusResult.user.name,
            email: statusResult.user.email,
            role: statusResult.user.role,
          })
          setIsLoading(false)
          return
        }

        if (statusResult.status === 'SUSPENDED') {
          setError('Your account has been suspended. Please contact support.')
          setIsLoading(false)
          return
        }

        if (statusResult.status === 'INACTIVE') {
          setError('Your account is inactive. Please contact your coordinator.')
          setIsLoading(false)
          return
        }

        setError(statusResult.error || 'Invalid email or password')
        setIsLoading(false)
        return
      }

      // If status is ACTIVE, proceed with NextAuth sign in
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        // Successful login - redirect to dashboard based on role
        const role = statusResult.user.role
        const redirectUrl = role === 'ADMIN'
          ? '/dashboard/admin'
          : '/dashboard/coordinator'

        // Use window.location for hard redirect to ensure proper navigation
        console.log('Login successful, redirecting to:', redirectUrl)
        window.location.href = redirectUrl
        return
      }

      setError('Login failed. Please try again.')
      setIsLoading(false)
    } catch (err) {
      setError('An error occurred during login')
      setIsLoading(false)
    }
  }

  // Pending Approval Screen
  if (showPendingScreen && userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg border border-blue-200">
            {/* Icon Header */}
            <div className="px-8 py-6 border-b border-blue-100 bg-blue-50">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 text-center">Account Pending Approval</h1>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              <div className="text-center space-y-4">
                <p className="text-gray-700">
                  Hello <span className="font-semibold">{userInfo.name}</span>!
                </p>
                <p className="text-gray-600">
                  Your account has been created successfully, but it is currently waiting for approval from your higher coordinator.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-blue-900 font-semibold mb-2">Account Details:</p>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><span className="font-medium">Email:</span> {userInfo.email}</p>
                    <p><span className="font-medium">Role:</span> {userInfo.role.replace(/_/g, ' ')}</p>
                    <p><span className="font-medium">Status:</span> Pending Approval</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Please wait for your superior to approve your account. You will be able to log in once approved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <button
                onClick={() => {
                  setShowPendingScreen(false)
                  setUserInfo(null)
                }}
                className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 text-center">Sign In</h1>
            <p className="text-gray-600 text-center mt-1">Welcome back to ARPUFRL</p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {/* Success Message */}
            {signupSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Account created successfully!</p>
                  <p className="text-xs text-green-700 mt-1">Please sign in with your credentials.</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@example.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Admin Info */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs font-semibold text-blue-900 mb-1">Demo Admin Login:</p>
              <p className="text-xs text-blue-700">Email: admin@arpufrl.demo</p>
              <p className="text-xs text-blue-700">Password: DemoAdmin@2025</p>
            </div>

            {/* Signup Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}