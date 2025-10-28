import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactForm from '@/components/forms/ContactForm'

describe('ContactForm', () => {
  it('renders all form fields', () => {
    render(<ContactForm />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/inquiry type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it('shows required field indicators', () => {
    render(<ContactForm />)

    expect(screen.getByText(/full name \*/i)).toBeInTheDocument()
    expect(screen.getByText(/email address \*/i)).toBeInTheDocument()
    expect(screen.getByText(/inquiry type \*/i)).toBeInTheDocument()
    expect(screen.getByText(/subject \*/i)).toBeInTheDocument()
    expect(screen.getByText(/message \*/i)).toBeInTheDocument()
  })

  it('renders inquiry type options', () => {
    render(<ContactForm />)

    const inquirySelect = screen.getByLabelText(/inquiry type/i)
    expect(inquirySelect).toBeInTheDocument()

    // Check if default option is selected
    expect(screen.getByDisplayValue('General Inquiry')).toBeInTheDocument()
  })

  it('updates form fields when user types', () => {
    render(<ContactForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const messageInput = screen.getByLabelText(/message/i)

    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
    fireEvent.change(messageInput, { target: { value: 'Test message' } })

    expect(nameInput).toHaveValue('John Doe')
    expect(emailInput).toHaveValue('john@example.com')
    expect(messageInput).toHaveValue('Test message')
  })

  it('submits form with valid data', async () => {
    render(<ContactForm />)

    // Fill out required fields
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Test Subject' }
    })
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'Test message content' }
    })

    const submitButton = screen.getByRole('button', { name: /send message/i })
    fireEvent.click(submitButton)

    // Check for loading state
    expect(screen.getByText('Sending Message...')).toBeInTheDocument()

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/thank you for your message/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('validates required fields', () => {
    render(<ContactForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const subjectInput = screen.getByLabelText(/subject/i)
    const messageInput = screen.getByLabelText(/message/i)

    expect(nameInput).toBeRequired()
    expect(emailInput).toBeRequired()
    expect(subjectInput).toBeRequired()
    expect(messageInput).toBeRequired()
  })

  it('shows privacy notice', () => {
    render(<ContactForm />)

    expect(screen.getByText(/we respect your privacy/i)).toBeInTheDocument()
  })
})