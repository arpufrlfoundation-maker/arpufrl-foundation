import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import Contact, { InquiryType } from '@/models/Contact'
import { sendEmail } from '@/lib/email'
import info from '@/data/info.json'

/**
 * POST /api/contact
 * Submit a contact form inquiry (PUBLIC - no authentication required)
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    const body = await req.json()
    const { name, email, phone, subject, inquiryType, message } = body

    // Validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Please provide name, email, subject, and message'
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email',
          message: 'Please provide a valid email address'
        },
        { status: 400 }
      )
    }

    // Validate inquiry type
    if (inquiryType && !Object.values(InquiryType).includes(inquiryType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid inquiry type',
          message: 'Please select a valid inquiry type'
        },
        { status: 400 }
      )
    }

    // Create contact inquiry
    const contact = await Contact.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      subject: subject.trim(),
      inquiryType: inquiryType || InquiryType.GENERAL,
      message: message.trim()
    })

    // Send email notification to admin (optional - won't fail if email fails)
    try {
      const inquiryTypeLabels: Record<string, string> = {
        general: 'General Inquiry',
        volunteer: 'Volunteer Opportunity',
        partnership: 'Partnership',
        donation: 'Donation Support',
        media: 'Media & Press',
        other: 'Other'
      }

      await sendEmail({
        to: info.organization.email,
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          <p><strong>Inquiry Type:</strong> ${inquiryTypeLabels[inquiryType] || inquiryType}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Submitted at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small></p>
        `
      })

      // Send confirmation email to user
      await sendEmail({
        to: email,
        subject: 'Thank you for contacting ARPU Foundation',
        html: `
          <h2>Thank You for Reaching Out!</h2>
          <p>Dear ${name},</p>
          <p>We have received your message and our team will get back to you within 24 hours.</p>
          <p><strong>Your inquiry details:</strong></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Inquiry Type:</strong> ${inquiryTypeLabels[inquiryType] || inquiryType}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p>Best regards,<br>ARPU Future Rise Life Foundation Team</p>
          <p><small>Email: ${info.organization.email}</small></p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your message! We will get back to you within 24 hours.',
        contactId: contact._id.toString()
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error processing contact form:', error)

    // Handle validation errors from mongoose
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: error.message
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit contact form',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/contact
 * Get all contact inquiries (ADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const inquiryType = searchParams.get('inquiryType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const query: any = {}

    if (status) {
      query.status = status
    }

    if (inquiryType) {
      query.inquiryType = inquiryType
    }

    const skip = (page - 1) * limit

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching contact inquiries:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contact inquiries',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
