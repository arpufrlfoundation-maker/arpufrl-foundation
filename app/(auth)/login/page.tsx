import LoginForm from '@/components/forms/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">ARPUFRL</h1>
          <p className="text-gray-600">ARPU Future Rise Life Foundation</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm />
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Need help? Contact us at{' '}
          <a href="mailto:support@arpufrl.org" className="text-blue-600 hover:text-blue-500">
            support@arpufrl.org
          </a>
        </p>
      </div>
    </div>
  )
}