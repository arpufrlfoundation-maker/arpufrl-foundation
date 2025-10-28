import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '../../components/ui/button'

export const metadata: Metadata = {
  title: 'Account Inactive - ARPU Future Rise Life Foundation',
  description: 'Your account is currently inactive. Please contact support for assistance.',
}

export default function AccountInactivePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Inactive
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your account is currently inactive and requires approval.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              <p className="mb-4">
                Your account status is currently set to inactive. This could be because:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Your account is pending approval from an administrator</li>
                <li>Your account has been temporarily suspended</li>
                <li>You need to verify your email address</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                What can you do?
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Contact our support team for assistance</li>
                <li>Check your email for verification instructions</li>
                <li>Wait for administrator approval if you're a coordinator</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-3 pt-4">
              <Button asChild>
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/">
                  Return to Homepage
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  )
}