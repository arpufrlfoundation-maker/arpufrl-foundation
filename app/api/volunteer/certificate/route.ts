import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
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

    // Find approved volunteer request
    const volunteerRequest = await VolunteerRequest.findOne({
      email: session.user.email,
      status: 'ACCEPTED'
    })

    if (!volunteerRequest) {
      return NextResponse.json(
        { error: 'Certificate not available. Your volunteer application must be approved first.' },
        { status: 404 }
      )
    }

    // Find certificate
    let certificate = await Certificate.findOne({
      userId: userId,
      certificateType: 'VOLUNTEER'
    })

    // If no certificate exists, create one
    if (!certificate) {
      certificate = await Certificate.create({
        userId: userId,
        userName: volunteerRequest.name,
        certificateType: 'VOLUNTEER',
        title: 'Volunteer Certificate',
        description: `This certifies that ${volunteerRequest.name} has been accepted as a volunteer with Arpu Foundation.`,
        additionalInfo: {
          interests: volunteerRequest.interests.join(', '),
          approvedDate: volunteerRequest.reviewedAt
        },
        validFrom: new Date(),
        status: 'ACTIVE'
      })

      // Update volunteer request with certificate info
      volunteerRequest.certificateIssued = true
      volunteerRequest.certificateId = certificate._id
      volunteerRequest.certificateIssuedAt = new Date()
      await volunteerRequest.save()
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
