'use client'

import { ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex justify-center mb-3">
              <Mail className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 text-center">Reset Password</h1>
            <p className="text-gray-600 text-center mt-1">We'll help you get back in</p>
          </div>

          <div className="px-8 py-6">
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Password reset functionality is coming soon.
              </p>
              <p className="text-sm text-gray-500">
                For immediate assistance, please contact our support team.
              </p>
            </div>

            <Link
              href="/login"
              className="mt-8 w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
