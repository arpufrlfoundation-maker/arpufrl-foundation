/**
 * Payment Widget Component
 * Provides predefined donation amounts with Razorpay integration
 */

'use client'

import { useState } from 'react'
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

  const handlePayment = async () => {
    const amount = selectedAmount || parseInt(customAmount)

    if (!amount || amount < 21) {
      alert('Please select or enter an amount of at least ₹21')
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
          referralCode: referralCode || undefined,
          referredBy: userId || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const { orderId, amount: orderAmount } = await response.json()

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
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
    } catch (error) {
      console.error('Payment error:', error)
      alert('Failed to process payment. Please try again.')
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
        Support our cause with a contribution. Select an amount below:
      </p>

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
