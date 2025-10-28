import { renderHook, act } from '@testing-library/react'
import { usePayment } from '../../lib/hooks/usePayment'

// Mock fetch
global.fetch = jest.fn()

// Mock Razorpay
const mockRazorpay = {
  open: jest.fn(),
  on: jest.fn()
}

Object.defineProperty(window, 'Razorpay', {
  value: jest.fn(() => mockRazorpay),
  writable: true
})

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => ({
    src: '',
    async: false,
    onload: null,
    onerror: null
  })),
  writable: true
})

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn(),
  writable: true
})

describe('usePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
      ; (fetch as jest.Mock).mockClear()
    mockRazorpay.open.mockClear()

    // Reset window.Razorpay
    delete (window as any).Razorpay
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => usePayment())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.isProcessing).toBe(false)
  })

  it('loads Razorpay script when not available', async () => {
    const { result } = renderHook(() => usePayment())

    const mockScript = {
      src: '',
      async: false,
      onload: null,
      onerror: null
    }

      ; (document.createElement as jest.Mock).mockReturnValue(mockScript)

    const paymentData = {
      orderId: 'order_test123',
      amount: 50000,
      currency: 'INR',
      donationId: 'donation_123'
    }

    const donorInfo = {
      name: 'John Doe',
      email: 'john@example.com'
    }

    // Start payment initiation
    act(() => {
      result.current.initiatePayment(paymentData, donorInfo)
    })

    // Simulate script loading
    act(() => {
      if (mockScript.onload) {
        // Set Razorpay as available
        ; (window as any).Razorpay = jest.fn(() => mockRazorpay)
        mockScript.onload()
      }
    })

    expect(document.createElement).toHaveBeenCalledWith('script')
    expect(document.body.appendChild).toHaveBeenCalled()
  })

  it('uses existing Razorpay when available', async () => {
    // Set Razorpay as already available
    ; (window as any).Razorpay = jest.fn(() => mockRazorpay)

    const { result } = renderHook(() => usePayment())

    const paymentData = {
      orderId: 'order_test123',
      amount: 50000,
      currency: 'INR',
      donationId: 'donation_123'
    }

    const donorInfo = {
      name: 'John Doe',
      email: 'john@example.com'
    }

    await act(async () => {
      await result.current.initiatePayment(paymentData, donorInfo)
    })

    expect(window.Razorpay).toHaveBeenCalledWith(
      expect.objectContaining({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 50000,
        currency: 'INR',
        order_id: 'order_test123'
      })
    )
    expect(mockRazorpay.open).toHaveBeenCalled()
  })

  it('handles script loading failure', async () => {
    const { result } = renderHook(() => usePayment())

    const mockScript = {
      src: '',
      async: false,
      onload: null,
      onerror: null
    }

      ; (document.createElement as jest.Mock).mockReturnValue(mockScript)

    const paymentData = {
      orderId: 'order_test123',
      amount: 50000,
      currency: 'INR',
      donationId: 'donation_123'
    }

    const donorInfo = {
      name: 'John Doe'
    }

    const mockOnError = jest.fn()

    // Start payment initiation
    act(() => {
      result.current.initiatePayment(paymentData, donorInfo, { onError: mockOnError })
    })

    // Simulate script loading failure
    act(() => {
      if (mockScript.onerror) {
        mockScript.onerror()
      }
    })

    expect(result.current.error).toBe('Failed to load payment gateway. Please try again.')
    expect(mockOnError).toHaveBeenCalledWith('Failed to load payment gateway. Please try again.')
  })

  it('verifies payment successfully', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          donationId: 'donation_123',
          paymentId: 'pay_test123',
          status: 'SUCCESS'
        }
      })
    })

    const { result } = renderHook(() => usePayment())

    const paymentResponse = {
      razorpay_order_id: 'order_test123',
      razorpay_payment_id: 'pay_test123',
      razorpay_signature: 'valid_signature'
    }

    let verificationResult
    await act(async () => {
      verificationResult = await result.current.verifyPayment(paymentResponse, 'donation_123')
    })

    expect(fetch).toHaveBeenCalledWith('/api/donations/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: 'order_test123',
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'valid_signature',
        donationId: 'donation_123',
      }),
    })

    expect(verificationResult).toEqual({
      donationId: 'donation_123',
      paymentId: 'pay_test123',
      status: 'SUCCESS'
    })
  })

  it('handles payment verification failure', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Payment verification failed'
      })
    })

    const { result } = renderHook(() => usePayment())

    const paymentResponse = {
      razorpay_order_id: 'order_test123',
      razorpay_payment_id: 'pay_test123',
      razorpay_signature: 'invalid_signature'
    }

    await act(async () => {
      try {
        await result.current.verifyPayment(paymentResponse, 'donation_123')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe('Payment verification failed')
      }
    })
  })

  it('handles successful payment flow', async () => {
    // Set Razorpay as available
    ; (window as any).Razorpay = jest.fn((options) => {
      // Simulate successful payment
      setTimeout(() => {
        options.handler({
          razorpay_order_id: 'order_test123',
          razorpay_payment_id: 'pay_test123',
          razorpay_signature: 'valid_signature'
        })
      }, 0)
      return mockRazorpay
    })

      // Mock successful verification
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { donationId: 'donation_123', paymentId: 'pay_test123' }
        })
      })

    const { result } = renderHook(() => usePayment())

    const paymentData = {
      orderId: 'order_test123',
      amount: 50000,
      currency: 'INR',
      donationId: 'donation_123'
    }

    const donorInfo = {
      name: 'John Doe',
      email: 'john@example.com'
    }

    const mockOnSuccess = jest.fn()

    await act(async () => {
      await result.current.initiatePayment(paymentData, donorInfo, { onSuccess: mockOnSuccess })
    })

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(mockOnSuccess).toHaveBeenCalledWith('pay_test123', 'donation_123')
  })

  it('handles payment cancellation', async () => {
    // Set Razorpay as available
    ; (window as any).Razorpay = jest.fn((options) => {
      // Simulate payment cancellation
      setTimeout(() => {
        options.modal.ondismiss()
      }, 0)
      return mockRazorpay
    })

    const { result } = renderHook(() => usePayment())

    const paymentData = {
      orderId: 'order_test123',
      amount: 50000,
      currency: 'INR',
      donationId: 'donation_123'
    }

    const donorInfo = {
      name: 'John Doe'
    }

    const mockOnCancel = jest.fn()

    await act(async () => {
      await result.current.initiatePayment(paymentData, donorInfo, { onCancel: mockOnCancel })
    })

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
    })

    expect(result.current.error).toBe('Payment was cancelled')
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('clears error state', () => {
    const { result } = renderHook(() => usePayment())

    // Set an error
    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBe(null)
  })

  it('resets all state', () => {
    const { result } = renderHook(() => usePayment())

    act(() => {
      result.current.reset()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.isProcessing).toBe(false)
  })

  it('configures Razorpay options correctly', async () => {
    ; (window as any).Razorpay = jest.fn(() => mockRazorpay)

    const { result } = renderHook(() => usePayment())

    const paymentData = {
      orderId: 'order_test123',
      amount: 50000,
      currency: 'INR',
      donationId: 'donation_123',
      programName: 'Education Program'
    }

    const donorInfo = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210'
    }

    await act(async () => {
      await result.current.initiatePayment(paymentData, donorInfo)
    })

    expect(window.Razorpay).toHaveBeenCalledWith(
      expect.objectContaining({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 50000,
        currency: 'INR',
        name: 'ARPU Future Rise Life Foundation',
        description: 'Donation for Education Program',
        order_id: 'order_test123',
        prefill: {
          name: 'John Doe',
          email: 'john@example.com',
          contact: '+919876543210'
        },
        theme: {
          color: '#3B82F6'
        }
      })
    )
  })
})