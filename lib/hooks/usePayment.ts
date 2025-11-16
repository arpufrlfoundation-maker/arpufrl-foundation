'use client'

import { useState, useCallback } from 'react'

interface PaymentData {
  orderId: string
  amount: number
  currency: string
  donationId: string
  programName?: string
  referralCode?: string
  razorpayKeyId?: string
}

interface DonorInfo {
  name: string
  email?: string
  phone?: string
}

interface PaymentOptions {
  onSuccess?: (paymentId: string, donationId: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

interface PaymentState {
  isLoading: boolean
  error: string | null
  isProcessing: boolean
}

export function usePayment() {
  const [state, setState] = useState<PaymentState>({
    isLoading: false,
    error: null,
    isProcessing: false
  })

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true

      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)

      document.body.appendChild(script)
    })
  }, [])

  const initiatePayment = useCallback(async (
    paymentData: PaymentData,
    donorInfo: DonorInfo,
    options: PaymentOptions = {}
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please try again.')
      }

      // Check if Razorpay key is configured
      const razorpayKey = paymentData.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKey) {
        throw new Error('Payment configuration error: Razorpay key is missing. Please contact support.')
      }

      // Prepare Razorpay options
      const razorpayOptions = {
        key: razorpayKey,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'ARPU Future Rise Life Foundation',
        description: paymentData.programName
          ? `Donation for ${paymentData.programName}`
          : 'General Donation',
        order_id: paymentData.orderId,
        prefill: {
          name: donorInfo.name,
          email: donorInfo.email || '',
          contact: donorInfo.phone || '',
        },
        theme: {
          color: '#3B82F6',
        },
        handler: async (response: any) => {
          setState(prev => ({ ...prev, isProcessing: true }))

          try {
            await verifyPayment(response, paymentData.donationId)
            options.onSuccess?.(response.razorpay_payment_id, paymentData.donationId)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Payment verification failed'
            setState(prev => ({ ...prev, error: errorMessage }))
            options.onError?.(errorMessage)
          } finally {
            setState(prev => ({ ...prev, isProcessing: false, isLoading: false }))
          }
        },
        modal: {
          ondismiss: () => {
            setState(prev => ({ ...prev, isLoading: false, error: 'Payment was cancelled' }))
            options.onCancel?.()
          },
        },
      }

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(razorpayOptions)
      razorpay.open()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      options.onError?.(errorMessage)
    }
  }, [loadRazorpayScript])

  const verifyPayment = useCallback(async (paymentResponse: any, donationId: string) => {
    const response = await fetch('/api/donations/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        donationId,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Payment verification failed')
    }

    return result.data
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      isProcessing: false
    })
  }, [])

  return {
    ...state,
    initiatePayment,
    verifyPayment,
    clearError,
    reset
  }
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any
  }
}