/**
 * Payment Widget Component
 * Provides predefined donation amounts with Razorpay integration
 */

'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Loader2 } from 'lucide-react'

interface PaymentWidgetProps {
  referralCode?: string
  userId?: string
  userName?: string
  className?: string
}

const PREDEFINED_AMOUNTS = [21, 51, 101, 251, 501, 1001, 2001, 5001]

export function PaymentWidget({ referralCode, userId, userName, className = '' }: PaymentWidgetProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [selectedProgram, setSelectedProgram] = useState('')
  const [loadingPrograms, setLoadingPrograms] = useState(true)

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true)
      const response = await fetch('/api/programs?active=true')
      const data = await response.json()

      if (response.ok) {
        let programList = []

        // Handle different response structures
        if (data.success && data.data && data.data.programs) {
          programList = data.data.programs
        } else if (data.programs) {
          programList = data.programs
        } else if (Array.isArray(data)) {
          programList = data
        }

        setPrograms(programList)

        // Auto-select first program if available
        if (programList.length > 0) {
          const firstProgramId = programList[0]._id || programList[0].id
          setSelectedProgram(firstProgramId)
        }

        console.log('Programs loaded in PaymentWidget:', programList.length)
      } else {
        console.error('Failed to fetch programs:', response.status)
        // Retry once after 1 second
        setTimeout(fetchPrograms, 1000)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
      // Retry once after 2 seconds
      setTimeout(fetchPrograms, 2000)
    } finally {
      setLoadingPrograms(false)
    }
  }

  const handlePayment = async () => {
    const amount = selectedAmount || parseInt(customAmount)

    if (!amount || amount < 21) {
      alert('Please select or enter an amount of at least ₹21')
      return
    }

    if (!selectedProgram) {
      alert('Please select a program for your donation')
      return
    }

    setLoading(true)

    try {
      // Create order
      const response = await fetch('/api/donations/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          programId: selectedProgram,
          referralCode: referralCode || undefined,
          referredBy: userId || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const { orderId, amount: orderAmount, razorpayKeyId } = await response.json()

      // Check if Razorpay key is available
      const razorpayKey = razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKey) {
        throw new Error('Payment configuration error. Please contact support.')
      }

      // Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: orderAmount,
        currency: 'INR',
        name: 'Samarpan Sahayog Abhiyan',
        description: `Contribution via ${userName || 'Referral'}`,
        order_id: orderId,
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch('/api/donations/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          })

          if (verifyResponse.ok) {
            alert('Payment successful! Thank you for your contribution.')
            window.location.reload()
          } else {
            alert('Payment verification failed')
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#16a34a'
        }
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    } catch (error: any) {
      console.error('Payment error:', error)
      alert(error.message || 'Failed to process payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <DollarSign className="h-6 w-6 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Contribute Now</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Support our cause with a contribution. Select a program and amount below:
      </p>

      {/* Program Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Program <span className="text-red-500">*</span>
        </label>
        {loadingPrograms ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" />
            <span className="ml-2 text-sm text-gray-600">Loading programs...</span>
          </div>
        ) : (
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">-- Select a Program --</option>
            {programs.map((program) => (
              <option key={program._id || program.id} value={program._id || program.id}>
                {program.name}
              </option>
            ))}
          </select>
        )}
        {programs.length === 0 && !loadingPrograms && (
          <p className="text-xs text-red-500 mt-1">No programs available</p>
        )}
      </div>

      {/* Predefined Amounts */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {PREDEFINED_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => {
              setSelectedAmount(amount)
              setShowCustom(false)
              setCustomAmount('')
            }}
            className={`py-3 px-2 text-sm font-medium rounded-lg border-2 transition-all ${selectedAmount === amount
              ? 'border-green-600 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-green-300 text-gray-700'
              }`}
          >
            ₹{amount}
          </button>
        ))}
      </div>

      {/* Custom Amount Toggle */}
      <button
        onClick={() => {
          setShowCustom(!showCustom)
          setSelectedAmount(null)
        }}
        className="text-sm text-green-600 hover:text-green-700 font-medium mb-4"
      >
        {showCustom ? 'Hide' : 'Enter'} custom amount
      </button>

      {/* Custom Amount Input */}
      {showCustom && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Amount (₹)
          </label>
          <input
            type="number"
            min="21"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Enter amount (min ₹21)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Referral Info */}
      {referralCode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-green-700">
            <strong>Referral Code:</strong> {referralCode}
          </p>
          {userName && (
            <p className="text-xs text-green-600 mt-1">
              Supporting: {userName}
            </p>
          )}
        </div>
      )}

      {/* Pay Button */}
      <button
        onClick={handlePayment}
        disabled={loading || (!selectedAmount && !customAmount)}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <DollarSign className="h-5 w-5 mr-2" />
            Contribute ₹{selectedAmount || customAmount || 0}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        Secure payment powered by Razorpay
      </p>
    </div>
  )
}
