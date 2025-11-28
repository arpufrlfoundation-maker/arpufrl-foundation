import puppeteer from 'puppeteer'

// Organization constants
const ORG_CONSTANTS = {
  name: 'ARPU Future Rise Life Foundation',
  cin: 'U88900DL2025NPL451013',
  pan: 'ABDCA2272K',
  uniqueRegistrationNo: 'ABDCA2272KF20251',
  uniqueDocumentationNo: 'ABDCA2272KF2025101',
  email: 'info@arpufrl.org',
  website: 'www.arpufrl.org'
}

interface ReceiptData {
  receiptNumber: string
  donorName: string
  donorEmail?: string
  donorPhone?: string
  donorPAN?: string
  amount: number
  currency: string
  donationType?: string
  programName?: string
  donationDate: Date
  receiptGeneratedAt?: Date
  paymentId?: string
  transactionId?: string
  // Legacy fields from old interface - ignored but accepted for compatibility
  cinNumber?: string
  uniqueRegistrationNo?: string
  uniqueDocumentationNo?: string
  panNumber?: string
}

export async function generateReceiptPDF(receiptData: ReceiptData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    const formattedDate = new Date(receiptData.donationDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const formattedTime = new Date(receiptData.donationDate).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', Arial, sans-serif;
          background: #ffffff;
          color: #1e293b;
          line-height: 1.5;
        }

        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          position: relative;
        }

        /* Decorative border */
        .border-frame {
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          bottom: 15px;
          border: 3px solid #1e3a8a;
          pointer-events: none;
        }

        .border-frame-inner {
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          bottom: 5px;
          border: 1px solid #3b82f6;
        }

        .content-wrapper {
          padding: 50px 60px;
          position: relative;
          z-index: 1;
        }

        /* Header Section */
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 25px;
          border-bottom: 2px solid #1e3a8a;
        }

        .logo-container {
          margin-bottom: 15px;
        }

        .logo {
          width: 90px;
          height: 90px;
          margin: 0 auto;
          border-radius: 50%;
          object-fit: contain;
        }

        .logo-text {
          width: 80px;
          height: 80px;
          margin: 0 auto;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: 700;
          font-family: 'Playfair Display', serif;
        }

        .org-name {
          font-family: 'Playfair Display', serif;
          font-size: 26px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }

        .receipt-title {
          display: inline-block;
          font-size: 20px;
          font-weight: 600;
          color: #ffffff;
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          padding: 10px 40px;
          border-radius: 30px;
          margin-top: 15px;
          letter-spacing: 2px;
        }

        /* Organization Details Box */
        .org-details {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .org-details-title {
          font-weight: 600;
          color: #1e3a8a;
          margin-bottom: 12px;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .org-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .org-detail-item {
          display: flex;
          font-size: 12px;
        }

        .org-detail-label {
          font-weight: 600;
          color: #475569;
          min-width: 150px;
        }

        .org-detail-value {
          color: #1e293b;
          font-weight: 500;
        }

        /* Receipt Info Banner */
        .receipt-banner {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .receipt-number-section {
          flex: 1;
        }

        .receipt-number-label {
          font-size: 12px;
          color: #92400e;
          font-weight: 500;
          margin-bottom: 5px;
        }

        .receipt-number-value {
          font-size: 22px;
          font-weight: 700;
          color: #78350f;
          font-family: 'Inter', monospace;
        }

        .receipt-date-section {
          text-align: right;
        }

        .receipt-date-label {
          font-size: 12px;
          color: #92400e;
          font-weight: 500;
        }

        .receipt-date-value {
          font-size: 14px;
          font-weight: 600;
          color: #78350f;
        }

        /* Donor Information */
        .section {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .info-item {
          padding: 12px 15px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }

        .info-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        /* Donation Amount Box */
        .donation-box {
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
          border-radius: 15px;
          padding: 30px;
          margin-bottom: 25px;
          color: white;
          text-align: center;
        }

        .amount-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 10px;
          letter-spacing: 1px;
        }

        .amount-value {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 10px;
          font-family: 'Playfair Display', serif;
        }

        .amount-words {
          font-size: 14px;
          opacity: 0.9;
          font-style: italic;
          margin-bottom: 15px;
        }

        .program-info {
          padding-top: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          margin-top: 10px;
        }

        .program-label {
          font-size: 11px;
          opacity: 0.8;
          margin-bottom: 5px;
        }

        .program-name {
          font-size: 16px;
          font-weight: 600;
        }

        /* Tax Notice */
        .tax-notice {
          background: #ecfdf5;
          border: 1px solid #10b981;
          border-left: 4px solid #10b981;
          border-radius: 8px;
          padding: 15px 20px;
          margin-bottom: 25px;
        }

        .tax-notice-title {
          font-weight: 700;
          color: #065f46;
          font-size: 13px;
          margin-bottom: 5px;
        }

        .tax-notice-text {
          font-size: 12px;
          color: #047857;
          line-height: 1.6;
        }

        /* Footer */
        .footer {
          border-top: 2px solid #e2e8f0;
          padding-top: 25px;
          margin-top: 30px;
        }

        .thank-you {
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          font-weight: 600;
          color: #1e3a8a;
          margin-bottom: 15px;
        }

        .footer-note {
          text-align: center;
          font-size: 11px;
          color: #64748b;
          line-height: 1.8;
          margin-bottom: 20px;
        }

        .signature-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 30px;
        }

        .signature-box {
          text-align: center;
          min-width: 200px;
        }

        .signature-line {
          border-top: 1px solid #1e3a8a;
          margin-bottom: 8px;
        }

        .signature-text {
          font-size: 12px;
          color: #475569;
        }

        .signature-org {
          font-size: 11px;
          font-weight: 600;
          color: #1e3a8a;
          margin-top: 5px;
        }

        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 100px;
          font-weight: 700;
          color: rgba(30, 58, 138, 0.03);
          font-family: 'Playfair Display', serif;
          pointer-events: none;
          white-space: nowrap;
        }

        @media print {
          body { padding: 0; }
          .receipt-container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="border-frame">
          <div class="border-frame-inner"></div>
        </div>
        <div class="watermark">DONATION RECEIPT</div>

        <div class="content-wrapper">
          <!-- Header -->
          <div class="header">
            <div class="logo-container">
              <img src="https://www.arpufrl.org/ARPU-Logo.png" alt="ARPU Logo" class="logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
              <div class="logo-text" style="display:none;">ARPU</div>
            </div>
            <div class="org-name">${ORG_CONSTANTS.name.toUpperCase()}</div>
            <div class="receipt-title">DONATION RECEIPT</div>
          </div>

          <!-- Organization Details -->
          <div class="org-details">
            <div class="org-details-title">Organization Details</div>
            <div class="org-details-grid">
              <div class="org-detail-item">
                <span class="org-detail-label">CIN Number:</span>
                <span class="org-detail-value">${ORG_CONSTANTS.cin}</span>
              </div>
              <div class="org-detail-item">
                <span class="org-detail-label">PAN:</span>
                <span class="org-detail-value">${ORG_CONSTANTS.pan}</span>
              </div>
              <div class="org-detail-item">
                <span class="org-detail-label">Registration No:</span>
                <span class="org-detail-value">${ORG_CONSTANTS.uniqueRegistrationNo}</span>
              </div>
              <div class="org-detail-item">
                <span class="org-detail-label">Documentation No:</span>
                <span class="org-detail-value">${ORG_CONSTANTS.uniqueDocumentationNo}</span>
              </div>
            </div>
          </div>

          <!-- Receipt Info Banner -->
          <div class="receipt-banner">
            <div class="receipt-number-section">
              <div class="receipt-number-label">RECEIPT NUMBER</div>
              <div class="receipt-number-value">${receiptData.receiptNumber}</div>
            </div>
            <div class="receipt-date-section">
              <div class="receipt-date-label">Date & Time</div>
              <div class="receipt-date-value">${formattedDate}</div>
              <div class="receipt-date-value">${formattedTime}</div>
            </div>
          </div>

          <!-- Donor Information -->
          <div class="section">
            <div class="section-title">Donor Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Donor Name</div>
                <div class="info-value">${receiptData.donorName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">PAN Number</div>
                <div class="info-value">${receiptData.donorPAN || 'Not Provided'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email Address</div>
                <div class="info-value">${receiptData.donorEmail || 'Not Provided'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Mobile Number</div>
                <div class="info-value">${receiptData.donorPhone || 'Not Provided'}</div>
              </div>
            </div>
          </div>

          <!-- Donation Amount -->
          <div class="donation-box">
            <div class="amount-label">DONATION AMOUNT</div>
            <div class="amount-value">₹ ${receiptData.amount.toLocaleString('en-IN')}</div>
            <div class="amount-words">(${numberToWords(receiptData.amount)} Rupees Only)</div>
            ${receiptData.programName ? `
            <div class="program-info">
              <div class="program-label">PROGRAM / PROJECT</div>
              <div class="program-name">${receiptData.programName}</div>
            </div>
            ` : ''}
          </div>

          <!-- Tax Notice -->
          <div class="tax-notice">
            <div class="tax-notice-title">📋 Tax Deduction Information (Section 80G)</div>
            <div class="tax-notice-text">
              This donation is eligible for tax deduction under Section 80G of the Income Tax Act, 1961.
              Please preserve this receipt for your tax records. The deduction amount depends on the category of donation.
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="thank-you">🙏 Thank You for Your Generous Contribution! 🙏</div>
            <div class="footer-note">
              This is a computer-generated receipt and does not require a physical signature.<br>
              For any queries, please contact us at ${ORG_CONSTANTS.email} | ${ORG_CONSTANTS.website}
            </div>

            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-text">Authorized Signatory</div>
                <div class="signature-org">${ORG_CONSTANTS.name}</div>
              </div>
            </div>
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
        top: '10px',
        right: '10px',
        bottom: '10px',
        left: '10px'
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
