import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import VolunteerRequest from '@/models/VolunteerRequest'
import { Certificate } from '@/models/Certificate'
import { generateCertificatePDF } from '@/lib/pdf-certificate'

/**
 * GET /api/volunteer/certificate
 * Download volunteer certificate PDF
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || session.user.id

    // Only allow users to download their own certificate unless admin
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get user info
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is a volunteer
    if (user.role !== 'VOLUNTEER' && user.role !== 'COORDINATOR' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only volunteers can download volunteer certificates' },
        { status: 403 }
      )
    }

    // Try to find volunteer request for additional info (optional)
    const volunteerRequest = await VolunteerRequest.findOne({
      email: user.email
    }).sort({ createdAt: -1 })

    // Find or create certificate
    let certificate = await Certificate.findOne({
      userId: userId,
      certificateType: 'VOLUNTEER'
    })

    // If no certificate exists, create one
    if (!certificate) {
      certificate = await Certificate.create({
        userId: userId,
        userName: user.name,
        certificateType: 'VOLUNTEER',
        title: 'Volunteer Certificate',
        description: `This certifies that ${user.name} has registered as a volunteer with ARPU Future Rise Life Foundation.`,
        additionalInfo: {
          interests: volunteerRequest?.interests?.join(', ') || 'Community Service',
          registeredDate: user.createdAt || new Date()
        },
        validFrom: new Date(),
        status: 'ACTIVE'
      })

      // Update volunteer request with certificate info if exists
      if (volunteerRequest) {
        volunteerRequest.certificateIssued = true
        volunteerRequest.certificateId = certificate._id
        volunteerRequest.certificateIssuedAt = new Date()
        await volunteerRequest.save()
      }
    }

    // Generate PDF
    const pdfBuffer = await generateCertificatePDF(certificate)

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="volunteer-certificate-${certificate.certificateNumber}.pdf"`
      }
    })

  } catch (error: any) {
    console.error('Error generating volunteer certificate:', error)
    return NextResponse.json(
      { error: 'Failed to generate certificate', message: error.message },
      { status: 500 }
    )
  }
}
