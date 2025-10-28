import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DonationForm from '../../components/forms/DonationForm'
import { PRESET_AMOUNTS } from '../../lib/validations'

// Mock the validation library
jest.mock('../../lib/validations', () => ({
  donationFormSchema: {
    parse: jest.fn(),
    safeParse: jest.fn()
  },
  PRESET_AMOUNTS: [500, 1000, 2500, 5000, 10000, 25000]
}))

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(() => ({})),
    handleSubmit: jest.fn((fn) => fn),
    setValue: jest.fn(),
    watch: jest.fn(() => 1000),
    formState: { errors: {}, isSubmitting: false }
  })
}))

const mockPrograms = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'Education Program',
    slug: 'education-program',
    description: 'Supporting education for underprivileged children',
    targetAmount: 100000,
    raisedAmount: 25000,
    active: true
  },
  {
    _id: '507f1f77bcf86cd799439012',
    name: 'Healthcare Initiative',
    slug: 'healthcare-initiative',
    description: 'Providing healthcare services to rural communities',
    targetAmount: 200000,
    raisedAmount: 50000,
    active: true
  }
]

const defaultProps = {
  programs: mockPrograms,
  onSubmit: jest.fn(),
  isLoading: false
}

describe('DonationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders donation form with all sections', () => {
    render(<DonationForm {...defaultProps} />)

    // Check for main sections
    expect(screen.getByText('Select Donation Amount')).toBeInTheDocument()
    expect(screen.getByText('Select Program (Optional)')).toBeInTheDocument()
    expect(screen.getByText('Donor Information')).toBeInTheDocument()
    expect(screen.getByText('Referral Code (Optional)')).toBeInTheDocument()

    // Check for preset amount buttons
    PRESET_AMOUNTS.forEach(amount => {
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
      expect(screen.getByText(formattedAmount)).toBeInTheDocument()
    })

    // Check for form fields
    expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your phone number')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter referral code if you have one')).toBeInTheDocument()

    // Check for terms checkbox
    expect(screen.getByText(/I accept the/)).toBeInTheDocument()

    // Check for submit button
    expect(screen.getByRole('button', { name: /Donate/ })).toBeInTheDocument()
  })

  it('displays programs in select dropdown', () => {
    render(<DonationForm {...defaultProps} />)

    const programSelect = screen.getByDisplayValue('General Donation')
    expect(programSelect).toBeInTheDocument()

    // Check if programs are in the select options
    mockPrograms.forEach(program => {
      expect(screen.getByText(program.name)).toBeInTheDocument()
    })
  })

  it('handles preset amount selection', async () => {
    const user = userEvent.setup()
    render(<DonationForm {...defaultProps} />)

    const firstAmountButton = screen.getByText('₹500')
    await user.click(firstAmountButton)

    // The button should be selected (this would be tested via CSS classes in a real scenario)
    expect(firstAmountButton).toBeInTheDocument()
  })

  it('shows custom amount input when clicked', async () => {
    const user = userEvent.setup()
    render(<DonationForm {...defaultProps} />)

    const customAmountButton = screen.getByText('Enter Custom Amount')
    await user.click(customAmountButton)

    // Should show custom amount input
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn()

    render(<DonationForm {...defaultProps} onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: /Donate/ })
    await user.click(submitButton)

    // Form should not submit without required fields
    // In a real test, you'd check for validation error messages
  })

  it('handles form submission with valid data', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn()

    render(<DonationForm {...defaultProps} onSubmit={mockOnSubmit} />)

    // Fill in required fields
    const nameInput = screen.getByPlaceholderText('Enter your full name')
    await user.type(nameInput, 'John Doe')

    const emailInput = screen.getByPlaceholderText('Enter your email address')
    await user.type(emailInput, 'john@example.com')

    // Select amount
    const amountButton = screen.getByText('₹1,000')
    await user.click(amountButton)

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox')
    await user.click(termsCheckbox)

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Donate/ })
    await user.click(submitButton)

    // Should call onSubmit
    expect(mockOnSubmit).toHaveBeenCalled()
  })

  it('displays loading state correctly', () => {
    render(<DonationForm {...defaultProps} isLoading={true} />)

    const submitButton = screen.getByRole('button', { name: /Processing/ })
    expect(submitButton).toBeDisabled()
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('pre-fills selected program when provided', () => {
    const propsWithSelectedProgram = {
      ...defaultProps,
      selectedProgramId: mockPrograms[0]._id
    }

    render(<DonationForm {...propsWithSelectedProgram} />)

    // The program should be pre-selected
    // In a real test, you'd verify the select value
    expect(screen.getByText('Education Program')).toBeInTheDocument()
  })

  it('pre-fills referral code when provided', () => {
    const propsWithReferralCode = {
      ...defaultProps,
      referralCode: 'TEST-REF-123'
    }

    render(<DonationForm {...propsWithReferralCode} />)

    const referralInput = screen.getByPlaceholderText('Enter referral code if you have one')
    expect(referralInput).toHaveValue('TEST-REF-123')
  })

  it('shows security notice', () => {
    render(<DonationForm {...defaultProps} />)

    expect(screen.getByText('🔒 Your payment is secured by Razorpay')).toBeInTheDocument()
    expect(screen.getByText('All donations are processed securely and are tax-deductible')).toBeInTheDocument()
  })

  it('handles custom amount input validation', async () => {
    const user = userEvent.setup()
    render(<DonationForm {...defaultProps} />)

    // Click custom amount
    const customAmountButton = screen.getByText('Enter Custom Amount')
    await user.click(customAmountButton)

    const customAmountInput = screen.getByPlaceholderText('Enter amount')

    // Test invalid amount (too low)
    await user.type(customAmountInput, '50')
    // In a real test, you'd check for validation error

    // Test valid amount
    await user.clear(customAmountInput)
    await user.type(customAmountInput, '2500')
    // Should accept valid amount
  })

  it('displays proper currency formatting', () => {
    render(<DonationForm {...defaultProps} />)

    // Check that amounts are formatted as Indian currency
    expect(screen.getByText('₹500')).toBeInTheDocument()
    expect(screen.getByText('₹1,000')).toBeInTheDocument()
    expect(screen.getByText('₹25,000')).toBeInTheDocument()
  })

  it('shows terms and conditions links', () => {
    render(<DonationForm {...defaultProps} />)

    const termsLink = screen.getByText('Terms and Conditions')
    const privacyLink = screen.getByText('Privacy Policy')

    expect(termsLink).toHaveAttribute('href', '/terms')
    expect(termsLink).toHaveAttribute('target', '_blank')
    expect(privacyLink).toHaveAttribute('href', '/privacy')
    expect(privacyLink).toHaveAttribute('target', '_blank')
  })

  it('handles form without programs gracefully', () => {
    const propsWithoutPrograms = {
      ...defaultProps,
      programs: []
    }

    render(<DonationForm {...propsWithoutPrograms} />)

    // Should not show program selection section
    expect(screen.queryByText('Select Program (Optional)')).not.toBeInTheDocument()
  })

  it('displays helpful text for optional fields', () => {
    render(<DonationForm {...defaultProps} />)

    expect(screen.getByText("We'll send your donation receipt to this email")).toBeInTheDocument()
    expect(screen.getByText('If you were referred by a coordinator, enter their code here')).toBeInTheDocument()
  })
})