import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'
import { sendEmail } from '@/lib/email'
import { generateReceiptHTML } from '@/lib/receipt-html'

// Receipt request schema
const receiptRequestSchema = z.object({
  donationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid donation ID'),
})

// POST /api/donations/receipt - Send donation receipt email
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()

    // Validate request data
    const validationResult = receiptRequestSchema.safeParse(body)
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

    const { donationId } = validationResult.data

    // Find donation with populated fields
    const donation = await Donation.findById(donationId)
      .populate('programId', 'name slug')
      .populate('referralCodeId', 'code')

    if (!donation) {
      return NextResponse.json(
        { success: false, error: 'Donation not found' },
        { status: 404 }
      )
    }

    // Only send receipts for successful donations
    if (donation.paymentStatus !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Cannot send receipt for incomplete donation' },
        { status: 400 }
      )
    }

    // Check if donor has email
    if (!donation.donorEmail) {
      return NextResponse.json(
        { success: false, error: 'No email address provided for this donation' },
        { status: 400 }
      )
    }

    // Generate receipt data
    const receiptData = generateReceiptData(donation)

    // Generate HTML receipt
    const receiptHtml = generateReceiptHTML(receiptData)

    // Send receipt email
    try {
      await sendEmail({
        to: donation.donorEmail,
        subject: `Donation Receipt - ${receiptData.receiptNumber}`,
        html: receiptHtml,
        text: `Thank you for your donation of ₹${receiptData.amount.toLocaleString('en-IN')} to ${receiptData.programName}.

Receipt Number: ${receiptData.receiptNumber}
Payment ID: ${receiptData.paymentId}
Date: ${new Date(receiptData.donationDate).toLocaleDateString('en-IN')}

This donation is eligible for tax deduction under Section 80G of the Income Tax Act.

Thank you for supporting Samarpan Sahayog Abhiyan!`
      })

      console.log('Donation receipt sent to:', donation.donorEmail)

      return NextResponse.json({
        success: true,
        message: 'Receipt sent successfully to ' + donation.donorEmail,
        data: {
          donationId: donation._id,
          email: donation.donorEmail,
          receiptNumber: receiptData.receiptNumber
        }
      })
    } catch (emailError) {
      console.error('Failed to send receipt email:', emailError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send receipt email',
          message: emailError instanceof Error ? emailError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error sending receipt:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send receipt',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to generate receipt data
function generateReceiptData(donation: any) {
  const date = new Date(donation.createdAt)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const id = donation._id.toString().slice(-6).toUpperCase()

  const receiptNumber = `ARPU-${year}${month}${day}-${id}`

  return {
    receiptNumber,
    donationId: donation._id,
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    amount: donation.amount,
    currency: donation.currency,
    paymentId: donation.razorpayPaymentId,
    programName: donation.programId?.name,
    referralCode: donation.referralCodeId?.code,
    donationDate: donation.createdAt,
    organizationName: 'ARPU Future Rise Life Foundation',
    taxDeductionNote: 'This donation is eligible for tax deduction under Section 80G of the Income Tax Act.'
  }
}

// GET method not allowed
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  )
}
