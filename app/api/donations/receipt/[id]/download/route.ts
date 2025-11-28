import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Donation, PaymentStatus } from '@/models/Donation'
import { generateReceiptPDF } from '@/lib/pdf-receipt'

export const dynamic = 'force-dynamic'

/**
 * GET /api/donations/receipt/[id]/download
 * Download donation receipt as PDF
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectToDatabase()

    // Find the donation with populated fields
    const donation = await Donation.findById(id)
      .populate('programId', 'name slug')
      .populate('referralCodeId', 'code')

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      )
    }

    // Check if payment is successful
    if (donation.paymentStatus !== PaymentStatus.SUCCESS) {
      return NextResponse.json(
        { success: false, error: 'Receipt only available for successful donations' },
        { status: 400 }
      )
    }

    // Generate receipt number
    const receiptNumber = `REC-${donation._id.toString().slice(-8).toUpperCase()}`

    // Generate receipt data
    const receiptData = {
      receiptNumber,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail || undefined,
      donorPhone: donation.donorPhone || undefined,
      donorPAN: donation.donorPAN || undefined,
      amount: donation.amount,
      currency: donation.currency,
      programName: (donation.programId as any)?.name || 'General Donation',
      donationDate: donation.createdAt,
      paymentId: donation.razorpayPaymentId || donation._id.toString(),
      transactionId: donation.razorpayOrderId || undefined
    }

    // Generate PDF using new receipt generator
    const pdfBuffer = await generateReceiptPDF(receiptData)

    // Return PDF as download
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="donation-receipt-${receiptNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error generating PDF receipt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF receipt' },
      { status: 500 }
    )
  }
}
