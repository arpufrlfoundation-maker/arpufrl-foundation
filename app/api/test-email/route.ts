import { NextRequest, NextResponse } from 'next/server'
import { sendDonationConfirmationEmail, verifyEmailConfig } from '@/lib/email'

// Make this route public (no authentication required)
export const dynamic = 'force-dynamic'

/**
 * POST /api/test-email
 * Test email functionality
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Verify email configuration
    const isConfigured = await verifyEmailConfig()
    
    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email is not configured. Please check your environment variables.',
          hint: 'Set EMAIL_SERVER_USER and EMAIL_SERVER_PASSWORD in .env.local'
        },
        { status: 500 }
      )
    }

    // Send test email
    const sent = await sendDonationConfirmationEmail(
      email,
      name || 'Test User',
      1000,
      'Test Program',
      'TEST-' + Date.now(),
      'pay_test_' + Date.now()
    )

    if (sent) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${email}`
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send email. Check server logs for details.'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test email',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/test-email
 * Check email configuration
 */
export async function GET() {
  try {
    const isConfigured = await verifyEmailConfig()
    
    return NextResponse.json({
      success: true,
      configured: isConfigured,
      config: {
        host: process.env.EMAIL_SERVER_HOST || 'Not set',
        port: process.env.EMAIL_SERVER_PORT || 'Not set',
        user: process.env.EMAIL_SERVER_USER ? '✓ Set' : '✗ Not set',
        password: process.env.EMAIL_SERVER_PASSWORD ? '✓ Set' : '✗ Not set',
        from: process.env.EMAIL_FROM || 'Not set'
      },
      message: isConfigured
        ? 'Email is properly configured'
        : 'Email configuration is missing or invalid'
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
