import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Donation, PaymentStatus } from '@/models/Donation'
import { generateReceiptHTML } from '@/lib/receipt-html'
import puppeteer from 'puppeteer'

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

    // Generate receipt data
    const receiptData = {
      receiptNumber: `REC-${donation._id.toString().slice(-8).toUpperCase()}`,
      donationId: donation._id,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail || '',
      donorPhone: donation.donorPhone,
      amount: donation.amount,
      currency: donation.currency,
      programName: (donation.programId as any)?.name || 'General Donation',
      donationDate: donation.createdAt,
      paymentId: donation.razorpayPaymentId || donation._id.toString(),
      referralCode: (donation.referralCodeId as any)?.code,
      organizationName: 'ARPU Future Rise Life Foundation',
      taxDeductionNote: 'This donation is eligible for tax deduction under Section 80G of the Income Tax Act.'
    }

    // Generate HTML receipt
    const receiptHtml = generateReceiptHTML(receiptData)

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(receiptHtml, { waitUntil: 'networkidle0' })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    })

    await browser.close()

    // Return PDF as download
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="donation-receipt-${receiptData.receiptNumber}.pdf"`,
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
