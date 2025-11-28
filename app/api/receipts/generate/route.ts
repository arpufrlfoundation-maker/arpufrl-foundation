import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'
import { Receipt } from '@/models/Receipt'
import { Certificate, CertificateType, CertificateStatus } from '@/models/Certificate'
import { Program } from '@/models/Program'
import { generateReceiptPDF } from '@/lib/pdf-receipt'
import { generateCertificatePDF } from '@/lib/pdf-certificate'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const { donationId } = await request.json()

    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      )
    }

    // Get donation details
    const donation = await Donation.findById(donationId).populate('programId') as any

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      )
    }

    if (donation.paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        { error: 'Only successful donations can have receipts generated' },
        { status: 400 }
      )
    }

    // Check if receipt already exists
    let receipt = await Receipt.findOne({ donationId: donation._id })

    if (!receipt) {
      // Create receipt record
      receipt = await Receipt.create({
        donationId: donation._id,
        // Organization details (using default values from schema)
        cinNumber: 'U88900DL2025NPL451013',
        uniqueRegistrationNo: 'ABDCA2272KF20251',
        uniqueDocumentationNo: 'ABDCA2272KF2025101',
        panNumber: 'ABDCA2272K',
        // Donor details
        donorName: donation.donorName,
        donorEmail: donation.donorEmail,
        donorPhone: donation.donorPhone,
        donorPAN: donation.donorPAN,
        // Donation details
        amount: donation.amount,
        currency: donation.currency,
        programName: donation.programId?.name,
        donationDate: donation.createdAt,
        receiptGeneratedAt: new Date(),
        emailSent: false
      })
    }

    // Generate PDF
    const receiptPDF = await generateReceiptPDF({
      receiptNumber: receipt.receiptNumber,
      cinNumber: receipt.cinNumber,
      uniqueRegistrationNo: receipt.uniqueRegistrationNo,
      uniqueDocumentationNo: receipt.uniqueDocumentationNo,
      panNumber: receipt.panNumber,
      donorName: receipt.donorName,
      donorEmail: receipt.donorEmail,
      donorPhone: receipt.donorPhone,
      donorPAN: receipt.donorPAN,
      amount: receipt.amount,
      currency: receipt.currency,
      programName: receipt.programName,
      donationDate: receipt.donationDate,
      receiptGeneratedAt: receipt.receiptGeneratedAt
    })

    // Generate Certificate of Appreciation
    const certificate = await Certificate.create({
      certificateType: CertificateType.APPRECIATION,
      recipientName: donation.donorName,
      recipientEmail: donation.donorEmail,
      eventName: `Donation to ${donation.programId?.name || 'ARPU Future Rise Life Foundation'}`,
      activityDescription: `Generous donation of ₹${donation.amount.toLocaleString('en-IN')}`,
      dateOfEvent: donation.createdAt,
      placeOfEvent: 'India',
      issueDate: new Date(),
      status: 'GENERATED',
      generatedAt: new Date()
    })

    const certificatePDF = await generateCertificatePDF({
      certificateNumber: certificate.certificateNumber,
      certificateType: certificate.certificateType,
      recipientName: certificate.recipientName,
      recipientDesignation: certificate.recipientDesignation,
      eventName: certificate.eventName,
      activityDescription: certificate.activityDescription,
      dateOfEvent: certificate.dateOfEvent,
      placeOfEvent: certificate.placeOfEvent,
      issueDate: certificate.issueDate
    })

    // Send email with attachments
    if (donation.donorEmail) {
      try {
        await sendEmail({
          to: donation.donorEmail,
          subject: `Donation Receipt - ${receipt.receiptNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e3a8a;">Thank You for Your Donation!</h2>
              <p>Dear ${donation.donorName},</p>
              <p>Thank you for your generous donation of <strong>₹${donation.amount.toLocaleString('en-IN')}</strong> to ARPU Future Rise Life Foundation.</p>
              <p>Please find your donation receipt and certificate of appreciation attached to this email.</p>

              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e3a8a; margin-top: 0;">Donation Details</h3>
                <p><strong>Receipt Number:</strong> ${receipt.receiptNumber}</p>
                <p><strong>Amount:</strong> ₹${donation.amount.toLocaleString('en-IN')}</p>
                <p><strong>Date:</strong> ${new Date(donation.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${donation.programId ? `<p><strong>Program:</strong> ${donation.programId.name}</p>` : ''}
                <p><strong>Transaction ID:</strong> ${donation.razorpayPaymentId || donation.transactionId}</p>
              </div>

              <p><strong>Tax Benefits:</strong> This donation is eligible for tax benefits under Section 80G of the Income Tax Act, 1961.</p>

              <p>Our organization details:</p>
              <ul>
                <li><strong>CIN:</strong> U88900DL2025NPL451013</li>
                <li><strong>PAN:</strong> ABDCA2272K</li>
                <li><strong>Registration No:</strong> ABDCA2272KF20251</li>
              </ul>

              <p>Thank you for supporting our mission!</p>

              <p>Best regards,<br>
              <strong>ARPU Future Rise Life Foundation</strong></p>
            </div>
          `,
          attachments: [
            {
              filename: `Receipt_${receipt.receiptNumber}.pdf`,
              content: receiptPDF,
              contentType: 'application/pdf'
            },
            {
              filename: `Certificate_${certificate.certificateNumber}.pdf`,
              content: certificatePDF,
              contentType: 'application/pdf'
            }
          ]
        })

        receipt.emailSent = true
        receipt.emailSentAt = new Date()
        await receipt.save()

        certificate.emailSent = true
        certificate.emailSentAt = new Date()
        certificate.status = CertificateStatus.SENT
        await certificate.save()
      } catch (emailError) {
        console.error('Failed to send receipt email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt._id,
        receiptNumber: receipt.receiptNumber,
        emailSent: receipt.emailSent
      },
      certificate: {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        emailSent: certificate.emailSent
      }
    })
  } catch (error) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to generate receipt', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to download receipt PDF
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const receiptId = searchParams.get('id')

    if (!receiptId) {
      return NextResponse.json(
        { error: 'Receipt ID is required' },
        { status: 400 }
      )
    }

    const receipt = await Receipt.findById(receiptId)

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      )
    }

    // Generate PDF
    const receiptPDF = await generateReceiptPDF({
      receiptNumber: receipt.receiptNumber,
      cinNumber: receipt.cinNumber,
      uniqueRegistrationNo: receipt.uniqueRegistrationNo,
      uniqueDocumentationNo: receipt.uniqueDocumentationNo,
      panNumber: receipt.panNumber,
      donorName: receipt.donorName,
      donorEmail: receipt.donorEmail,
      donorPhone: receipt.donorPhone,
      donorPAN: receipt.donorPAN,
      amount: receipt.amount,
      currency: receipt.currency,
      programName: receipt.programName,
      donationDate: receipt.donationDate,
      receiptGeneratedAt: receipt.receiptGeneratedAt
    })

    return new NextResponse(receiptPDF as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Receipt_${receipt.receiptNumber}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error downloading receipt:', error)
    return NextResponse.json(
      { error: 'Failed to download receipt' },
      { status: 500 }
    )
  }
}
