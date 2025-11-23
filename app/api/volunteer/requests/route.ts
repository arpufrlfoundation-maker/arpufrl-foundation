import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import VolunteerRequest, { VolunteerInterest, VolunteerRequestStatus } from '@/models/VolunteerRequest'
import { sendEmail } from '@/lib/email'
import { User, UserRole } from '@/models/User'

// Make this route publicly accessible
export const dynamic = 'force-dynamic'

// Volunteer request validation schema
const volunteerRequestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  state: z.string().optional(),
  city: z.string().optional(),
  interests: z.array(z.enum([
    VolunteerInterest.TEACHING,
    VolunteerInterest.HEALTHCARE,
    VolunteerInterest.FUNDRAISING,
    VolunteerInterest.SOCIAL_WORK,
    VolunteerInterest.ADMINISTRATIVE,
    VolunteerInterest.TECHNICAL,
    VolunteerInterest.OTHER
  ])).min(1, 'Please select at least one area of interest'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
  availability: z.string().min(1, 'Please specify your availability'),
  experience: z.string().max(500).optional()
})

/**
 * POST /api/volunteer/requests
 * Submit a new volunteer request (public endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Validate request data
    const validationResult = volunteerRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if email already has a pending request
    const existingRequest = await VolunteerRequest.findOne({
      email: data.email,
      status: VolunteerRequestStatus.PENDING
    })

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have a pending volunteer request. Please wait for review.'
        },
        { status: 400 }
      )
    }

    // Create volunteer request
    const volunteerRequest = await VolunteerRequest.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      state: data.state,
      city: data.city,
      interests: data.interests,
      message: data.message,
      availability: data.availability,
      experience: data.experience,
      status: VolunteerRequestStatus.PENDING,
      submittedAt: new Date()
    })

    // Send confirmation email to volunteer
    const volunteerEmailSubject = 'Thank You for Your Volunteer Application! 🙏'
    const volunteerEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Volunteering!</h1>
        </div>

        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${data.name},</p>

          <p style="font-size: 14px; margin-bottom: 15px;">
            Thank you for your interest in volunteering with us! We have received your application and our team will review it shortly.
          </p>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Application Details:</h3>
            <p style="margin: 5px 0;"><strong>Areas of Interest:</strong> ${data.interests.join(', ')}</p>
            <p style="margin: 5px 0;"><strong>Availability:</strong> ${data.availability}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${data.city ? data.city + ', ' : ''}${data.state || ''}</p>
            <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          </div>

          <p style="font-size: 14px; margin-bottom: 15px;">
            We will contact you at <strong>${data.email}</strong> or <strong>${data.phone}</strong> once your application has been reviewed.
          </p>

          <p style="font-size: 14px; margin-bottom: 15px;">
            If you have any questions in the meantime, please don't hesitate to reach out to us.
          </p>

          <p style="font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            <strong>The Team</strong>
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `

    const volunteerEmailText = `Dear ${data.name},

Thank you for your interest in volunteering with us! We have received your application and our team will review it shortly.

Application Details:
- Areas of Interest: ${data.interests.join(', ')}
- Availability: ${data.availability}
- Location: ${data.city ? data.city + ', ' : ''}${data.state || ''}
- Submitted: ${new Date().toLocaleDateString('en-IN')}

We will contact you at ${data.email} or ${data.phone} once your application has been reviewed.

Best regards,
The Team`

    // Send email to volunteer (non-blocking)
    sendEmail({
      to: data.email,
      subject: volunteerEmailSubject,
      html: volunteerEmailHtml,
      text: volunteerEmailText
    }).catch(error => console.error('Failed to send volunteer confirmation email:', error))

    // Send notification email to admin
    const adminUsers = await User.find({ role: UserRole.ADMIN }).select('email name')
    if (adminUsers.length > 0) {
      const adminEmailSubject = `New Volunteer Application from ${data.name}`
      const adminEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #667eea; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="color: white; margin: 0;">🆕 New Volunteer Application</h2>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">A new volunteer application has been submitted:</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">Applicant Information:</h3>
              <p style="margin: 8px 0;"><strong>Name:</strong> ${data.name}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${data.email}</p>
              <p style="margin: 8px 0;"><strong>Phone:</strong> ${data.phone}</p>
              <p style="margin: 8px 0;"><strong>Location:</strong> ${data.city ? data.city + ', ' : ''}${data.state || 'Not specified'}</p>
              <p style="margin: 8px 0;"><strong>Availability:</strong> ${data.availability}</p>
              <p style="margin: 8px 0;"><strong>Areas of Interest:</strong></p>
              <ul style="margin: 5px 0 0 20px;">
                ${data.interests.map(interest => `<li>${interest}</li>`).join('')}
              </ul>
            </div>

            <div style="background: #fff9e6; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>Message:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">${data.message}</p>
            </div>

            ${data.experience ? `
            <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>Previous Experience:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">${data.experience}</p>
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/admin/volunteers"
                 style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View in Dashboard
              </a>
            </div>

            <p style="font-size: 12px; color: #666; margin-top: 30px; text-align: center;">
              Submitted on ${new Date().toLocaleString('en-IN')}
            </p>
          </div>
        </body>
        </html>
      `

      const adminEmailText = `New Volunteer Application

Applicant Information:
- Name: ${data.name}
- Email: ${data.email}
- Phone: ${data.phone}
- Location: ${data.city ? data.city + ', ' : ''}${data.state || 'Not specified'}
- Availability: ${data.availability}
- Areas of Interest: ${data.interests.join(', ')}

Message:
${data.message}

${data.experience ? `Previous Experience:\n${data.experience}\n\n` : ''}

View full details in the dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/admin/volunteers

Submitted on ${new Date().toLocaleString('en-IN')}`

      // Send to all admin users (non-blocking)
      for (const admin of adminUsers) {
        if (admin.email) {
          sendEmail({
            to: admin.email,
            subject: adminEmailSubject,
            html: adminEmailHtml,
            text: adminEmailText
          }).catch(error => console.error(`Failed to send admin notification to ${admin.email}:`, error))
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your volunteer request has been submitted successfully! We will review it and get back to you soon.',
      data: {
        id: volunteerRequest._id,
        submittedAt: volunteerRequest.submittedAt
      }
    })

  } catch (error) {
    console.error('Error submitting volunteer request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit volunteer request',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/volunteer/requests
 * Get volunteer requests (admin only - will be protected by middleware)
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as VolunteerRequestStatus | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}
    if (status) {
      query.status = status
    }

    // Get requests with pagination
    const [requests, totalCount] = await Promise.all([
      VolunteerRequest.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('reviewedBy', 'name email')
        .lean(),
      VolunteerRequest.countDocuments(query)
    ])

    // Get status counts
    const [pendingCount, reviewedCount, acceptedCount, rejectedCount] = await Promise.all([
      VolunteerRequest.countDocuments({ status: VolunteerRequestStatus.PENDING }),
      VolunteerRequest.countDocuments({ status: VolunteerRequestStatus.REVIEWED }),
      VolunteerRequest.countDocuments({ status: VolunteerRequestStatus.ACCEPTED }),
      VolunteerRequest.countDocuments({ status: VolunteerRequestStatus.REJECTED })
    ])

    return NextResponse.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        stats: {
          pending: pendingCount,
          reviewed: reviewedCount,
          accepted: acceptedCount,
          rejected: rejectedCount,
          total: pendingCount + reviewedCount + acceptedCount + rejectedCount
        }
      }
    })

  } catch (error) {
    console.error('Error fetching volunteer requests:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch volunteer requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
