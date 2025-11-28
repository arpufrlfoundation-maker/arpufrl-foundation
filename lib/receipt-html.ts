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

// Generate professional HTML receipt for donations (used for emails)
export function generateReceiptHTML(data: {
  receiptNumber: string
  donorName: string
  donorEmail: string
  donorPhone?: string
  donorPAN?: string
  amount: number
  programName: string
  donationDate: Date
  paymentId: string
  donationId: any
  referralCode?: string
  organizationName?: string
  taxDeductionNote?: string
  currency: string
}) {
  const orgName = data.organizationName || ORG_CONSTANTS.name

  const formattedDate = new Date(data.donationDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formattedTime = new Date(data.donationDate).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Receipt - ${data.receiptNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      color: #1e293b;
      line-height: 1.6;
    }
    .receipt-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
      border: 3px solid #1e3a8a;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 35px 30px;
      text-align: center;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 50%;
      margin: 0 auto 15px;
      object-fit: contain;
    }
    .logo-fallback {
      width: 70px;
      height: 70px;
      background: white;
      border-radius: 50%;
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      color: #1e3a8a;
    }
    .header h1 {
      margin: 0 0 5px 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .receipt-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 8px 25px;
      border-radius: 20px;
      margin-top: 15px;
      font-size: 14px;
      letter-spacing: 2px;
    }
    .content { padding: 30px; }

    /* Organization Details */
    .org-details {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 25px;
    }
    .org-details-title {
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 12px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .org-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .org-item {
      font-size: 12px;
    }
    .org-label {
      font-weight: 600;
      color: #475569;
    }
    .org-value {
      color: #1e293b;
    }

    /* Receipt Banner */
    .receipt-banner {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .receipt-number {
      font-size: 20px;
      font-weight: 700;
      color: #78350f;
    }
    .receipt-date {
      text-align: right;
      font-size: 13px;
      color: #92400e;
    }

    /* Amount Box */
    .amount-box {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin: 25px 0;
    }
    .amount-label {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    .amount { font-size: 40px; font-weight: 700; }
    .amount-words {
      font-size: 12px;
      opacity: 0.9;
      font-style: italic;
      margin-top: 8px;
    }
    .program-info {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255,255,255,0.3);
      font-size: 14px;
    }

    /* Info Section */
    .section { margin-bottom: 25px; }
    .section-title {
      color: #1e3a8a;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .info-item {
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 3px solid #3b82f6;
    }
    .info-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    /* Tax Note */
    .tax-note {
      background: #ecfdf5;
      border: 1px solid #10b981;
      border-left: 4px solid #10b981;
      padding: 15px 18px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .tax-note-title {
      font-weight: 700;
      color: #065f46;
      margin-bottom: 5px;
      font-size: 13px;
    }
    .tax-note-text {
      font-size: 12px;
      color: #047857;
    }

    .footer {
      background: #1e3a8a;
      color: white;
      padding: 25px 30px;
      text-align: center;
    }
    .footer-org {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .footer-text {
      font-size: 12px;
      opacity: 0.9;
      line-height: 1.8;
    }

    @media print {
      body { background: white; }
      .receipt-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <img src="https://www.arpufrl.org/ARPU-Logo.png" alt="ARPU Logo" class="logo" style="background: white; padding: 8px;" />
      <h1>${ORG_CONSTANTS.name.toUpperCase()}</h1>
      <div class="receipt-badge">DONATION RECEIPT</div>
    </div>

    <div class="content">
      <!-- Organization Details -->
      <div class="org-details">
        <div class="org-details-title">Organization Details</div>
        <div class="org-grid">
          <div class="org-item">
            <span class="org-label">CIN:</span>
            <span class="org-value">${ORG_CONSTANTS.cin}</span>
          </div>
          <div class="org-item">
            <span class="org-label">PAN:</span>
            <span class="org-value">${ORG_CONSTANTS.pan}</span>
          </div>
          <div class="org-item">
            <span class="org-label">URN:</span>
            <span class="org-value">${ORG_CONSTANTS.uniqueRegistrationNo}</span>
          </div>
          <div class="org-item">
            <span class="org-label">UDN:</span>
            <span class="org-value">${ORG_CONSTANTS.uniqueDocumentationNo}</span>
          </div>
        </div>
      </div>

      <!-- Receipt Info Banner -->
      <div class="receipt-banner">
        <div>
          <div style="font-size: 11px; color: #92400e; margin-bottom: 5px;">RECEIPT NUMBER</div>
          <div class="receipt-number">${data.receiptNumber}</div>
        </div>
        <div class="receipt-date">
          <div><strong>Date:</strong> ${formattedDate}</div>
          <div><strong>Time:</strong> ${formattedTime}</div>
        </div>
      </div>

      <!-- Donor Information -->
      <div class="section">
        <div class="section-title">Donor Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Donor Name</div>
            <div class="info-value">${data.donorName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">PAN Number</div>
            <div class="info-value">${data.donorPAN || 'Not Provided'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email Address</div>
            <div class="info-value">${data.donorEmail || 'Not Provided'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Mobile Number</div>
            <div class="info-value">${data.donorPhone || 'Not Provided'}</div>
          </div>
        </div>
      </div>

      <!-- Donation Amount -->
      <div class="amount-box">
        <div class="amount-label">DONATION AMOUNT</div>
        <div class="amount">₹${data.amount.toLocaleString('en-IN')}</div>
        <div class="amount-words">(${numberToWordsEmail(data.amount)} Rupees Only)</div>
        <div class="program-info">
          <strong>Program:</strong> ${data.programName}
        </div>
      </div>

      <!-- Transaction Details -->
      <div class="section">
        <div class="section-title">Transaction Details</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Payment ID</div>
            <div class="info-value">${data.paymentId}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Donation ID</div>
            <div class="info-value">${data.donationId}</div>
          </div>
        </div>
      </div>

      <!-- Tax Notice -->
      <div class="tax-note">
        <div class="tax-note-title">📋 Tax Deduction Information (Section 80G)</div>
        <div class="tax-note-text">
          This donation is eligible for tax deduction under Section 80G of the Income Tax Act, 1961.
          Please preserve this receipt for your tax records. The deduction amount depends on the category of donation.
        </div>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 20px; text-align: center;">
        This is a computer-generated receipt and does not require a physical signature.
      </p>
    </div>

    <div class="footer">
      <div class="footer-org">🙏 Thank You for Your Generous Contribution! 🙏</div>
      <div class="footer-text">
        ${ORG_CONSTANTS.name}<br>
        Email: ${ORG_CONSTANTS.email} | Website: ${ORG_CONSTANTS.website}<br>
        © ${new Date().getFullYear()} All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>`

  return html
}

// Helper function to convert number to words (Indian system)
function numberToWordsEmail(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  if (num === 0) return 'Zero'

  let words = ''

  // Crores
  if (num >= 10000000) {
    words += numberToWordsEmail(Math.floor(num / 10000000)) + ' Crore '
    num %= 10000000
  }

  // Lakhs
  if (num >= 100000) {
    words += numberToWordsEmail(Math.floor(num / 100000)) + ' Lakh '
    num %= 100000
  }

  // Thousands
  if (num >= 1000) {
    words += numberToWordsEmail(Math.floor(num / 1000)) + ' Thousand '
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
