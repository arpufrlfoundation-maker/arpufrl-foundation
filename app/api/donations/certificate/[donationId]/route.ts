import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Donation, PaymentStatus } from '@/models/Donation'
import { Program } from '@/models/Program'
import { generateDonationCertificatePDF, generateDonationCertificateNumber } from '@/lib/pdf-donation-certificate'

/**
 * GET /api/donations/certificate/[donationId]
 * Download donation certificate PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ donationId: string }> }
) {
  try {
    const { donationId } = await params

    if (!donationId || donationId.length !== 24) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation ID' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Find the donation
    const donation = await Donation.findById(donationId)

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      )
    }

    // Only allow certificate for successful donations
    if (donation.paymentStatus !== PaymentStatus.SUCCESS) {
      return NextResponse.json(
        { success: false, error: 'Certificate is only available for successful donations' },
        { status: 400 }
      )
    }

    // Get program name
    let programName = 'General Donation'
    if (donation.programId) {
      const program = await Program.findById(donation.programId)
      if (program) {
        programName = program.name
      }
    }

    // Generate certificate number
    const certificateNumber = generateDonationCertificateNumber(
      donation._id.toString(),
      donation.createdAt
    )

    // Generate certificate PDF
    const pdfBuffer = await generateDonationCertificatePDF({
      certificateNumber,
      donorName: donation.donorName,
      amount: donation.amount,
      programName,
      donationDate: donation.createdAt,
      place: 'India',
      signatureName: 'Authorized Signatory',
      signatureDesignation: 'Secretary'
    })

    // Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="donation-certificate-${certificateNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating donation certificate:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate certificate' },
      { status: 500 }
    )
  }
}
