import puppeteer from 'puppeteer'
import { IDonation } from '@/models/Donation'
import { IReceipt } from '@/models/Receipt'

interface ReceiptData {
  receiptNumber: string
  cinNumber: string
  uniqueRegistrationNo: string
  uniqueDocumentationNo: string
  panNumber: string
  donorName: string
  donorEmail?: string
  donorPhone?: string
  donorPAN?: string
  amount: number
  currency: string
  donationType?: string
  programName?: string
  donationDate: Date
  receiptGeneratedAt: Date
}

export async function generateReceiptPDF(receiptData: ReceiptData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', Arial, sans-serif;
          padding: 40px;
          background: #ffffff;
        }

        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #1e3a8a;
          padding: 40px;
          background: white;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #1e3a8a;
          padding-bottom: 20px;
        }

        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
        }

        .org-name {
          font-size: 28px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 5px;
        }

        .receipt-title {
          font-size: 24px;
          font-weight: 600;
          color: #2563eb;
          margin-top: 15px;
        }

        .org-details {
          background: #f1f5f9;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          font-size: 11px;
          line-height: 1.6;
        }

        .org-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .detail-row {
          display: flex;
        }

        .detail-label {
          font-weight: 600;
          min-width: 140px;
          color: #334155;
        }

        .detail-value {
          color: #1e293b;
        }

        .receipt-info {
          margin-bottom: 25px;
          padding: 15px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
        }

        .receipt-number {
          font-size: 18px;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 5px;
        }

        .receipt-date {
          font-size: 13px;
          color: #78350f;
        }

        .donor-info {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .info-item {
          padding: 10px;
          background: #f8fafc;
          border-radius: 4px;
        }

        .info-label {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }

        .donation-info {
          margin-bottom: 25px;
          padding: 20px;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          border-radius: 8px;
          color: white;
        }

        .amount-display {
          text-align: center;
        }

        .amount-label {
          font-size: 14px;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .amount-value {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .amount-words {
          margin-top: 10px;
          font-size: 13px;
          opacity: 0.95;
          font-style: italic;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
        }

        .thank-you {
          font-size: 16px;
          font-weight: 600;
          color: #1e3a8a;
          margin-bottom: 10px;
        }

        .note {
          font-size: 11px;
          color: #64748b;
          line-height: 1.5;
          margin-top: 15px;
        }

        .signature-section {
          margin-top: 30px;
          text-align: right;
        }

        .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin: 40px 0 10px auto;
        }

        .signature-text {
          font-size: 12px;
          color: #475569;
        }

        @media print {
          body {
            padding: 0;
          }
          .receipt-container {
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="logo-section">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="48" fill="#1e3a8a" stroke="#2563eb" stroke-width="2"/>
              <path d="M50 20 L50 80 M30 35 L70 35 M30 50 L70 50 M30 65 L70 65" stroke="white" stroke-width="4" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="org-name">ARPU FUTURE RISE LIFE FOUNDATION</div>
          <div class="receipt-title">DONATION RECEIPT</div>
        </div>

        <div class="org-details">
          <div class="org-details-grid">
            <div class="detail-row">
              <span class="detail-label">CIN Number:</span>
              <span class="detail-value">${receiptData.cinNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">PAN:</span>
              <span class="detail-value">${receiptData.panNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Registration No:</span>
              <span class="detail-value">${receiptData.uniqueRegistrationNo}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Documentation No:</span>
              <span class="detail-value">${receiptData.uniqueDocumentationNo}</span>
            </div>
          </div>
        </div>

        <div class="receipt-info">
          <div class="receipt-number">Receipt No: ${receiptData.receiptNumber}</div>
          <div class="receipt-date">Date: ${new Date(receiptData.donationDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</div>
        </div>

        <div class="donor-info">
          <div class="section-title">Donor Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Name</div>
              <div class="info-value">${receiptData.donorName}</div>
            </div>
            ${receiptData.donorEmail ? `
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${receiptData.donorEmail}</div>
            </div>
            ` : ''}
            ${receiptData.donorPhone ? `
            <div class="info-item">
              <div class="info-label">Mobile</div>
              <div class="info-value">${receiptData.donorPhone}</div>
            </div>
            ` : ''}
            ${receiptData.donorPAN ? `
            <div class="info-item">
              <div class="info-label">PAN Number</div>
              <div class="info-value">${receiptData.donorPAN}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="donation-info">
          <div class="amount-display">
            <div class="amount-label">Donation Amount</div>
            <div class="amount-value">₹ ${receiptData.amount.toLocaleString('en-IN')}</div>
            <div class="amount-words">(${numberToWords(receiptData.amount)} Rupees Only)</div>
          </div>
          ${receiptData.programName ? `
          <div style="margin-top: 15px; text-align: center; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3);">
            <div style="font-size: 12px; opacity: 0.9;">Program/Project</div>
            <div style="font-size: 14px; font-weight: 600; margin-top: 4px;">${receiptData.programName}</div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <div class="thank-you">Thank you for your generous contribution!</div>
          <div class="note">
            This is a computer-generated receipt and does not require a physical signature.<br>
            This receipt is eligible for tax benefits under Section 80G of the Income Tax Act, 1961.<br>
            Please preserve this receipt for your tax records.
          </div>

          <div class="signature-section">
            <div class="signature-line"></div>
            <div class="signature-text">Authorized Signatory</div>
            <div class="signature-text" style="font-weight: 600; margin-top: 5px;">ARPU Future Rise Life Foundation</div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `

    await page.setContent(html, { waitUntil: 'networkidle0' })

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

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

// Helper function to convert number to words (Indian system)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  if (num === 0) return 'Zero'

  let words = ''

  // Crores
  if (num >= 10000000) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore '
    num %= 10000000
  }

  // Lakhs
  if (num >= 100000) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh '
    num %= 100000
  }

  // Thousands
  if (num >= 1000) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand '
    num %= 1000
  }

  // Hundreds
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred '
    num %= 100
  }

  // Tens and ones
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' '
    num %= 10
  } else if (num >= 10) {
    words += teens[num - 10] + ' '
    return words.trim()
  }

  if (num > 0) {
    words += ones[num] + ' '
  }

  return words.trim()
}
