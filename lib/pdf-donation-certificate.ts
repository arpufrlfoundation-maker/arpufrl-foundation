import puppeteer from 'puppeteer'

interface DonationCertificateData {
  certificateNumber: string
  donorName: string
  amount: number
  programName: string
  donationDate: Date
  place?: string
  signatureName?: string
  signatureDesignation?: string
}

// ARPU Logo SVG
const ARPU_LOGO_SVG = `
<svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="48" fill="#0c4a6e"/>
  <!-- Sun rays -->
  <path d="M50 20 L52 35 L48 35 Z" fill="#f59e0b"/>
  <path d="M70 30 L60 40 L57 37 Z" fill="#f59e0b"/>
  <path d="M80 50 L65 52 L65 48 Z" fill="#f59e0b"/>
  <path d="M30 30 L40 40 L43 37 Z" fill="#f59e0b"/>
  <path d="M20 50 L35 52 L35 48 Z" fill="#f59e0b"/>
  <!-- Sun -->
  <circle cx="50" cy="45" r="12" fill="#fbbf24"/>
  <!-- Hands/leaves -->
  <path d="M35 55 Q25 70 40 75 Q45 65 50 60 Q55 65 60 75 Q75 70 65 55 L50 50 Z" fill="#22c55e"/>
  <path d="M40 60 Q35 70 45 73" stroke="#16a34a" stroke-width="1" fill="none"/>
  <path d="M60 60 Q65 70 55 73" stroke="#16a34a" stroke-width="1" fill="none"/>
  <!-- Person silhouette -->
  <circle cx="50" cy="58" r="5" fill="#1e3a8a"/>
  <path d="M45 65 L50 75 L55 65 Z" fill="#1e3a8a"/>
</svg>
`

// Ribbon/Medal SVG
const RIBBON_SVG = `
<svg width="140" height="180" viewBox="0 0 140 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="goldGradient" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </radialGradient>
    <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fcd34d"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>

  <!-- Ribbon tails -->
  <path d="M45 100 L35 170 L55 140 L45 100" fill="url(#ribbonGradient)"/>
  <path d="M95 100 L105 170 L85 140 L95 100" fill="url(#ribbonGradient)"/>

  <!-- Outer ring -->
  <circle cx="70" cy="70" r="60" fill="#fef3c7"/>

  <!-- Main medal -->
  <circle cx="70" cy="70" r="50" fill="url(#goldGradient)"/>

  <!-- Decorative ridges -->
  <circle cx="70" cy="70" r="55" fill="none" stroke="#fbbf24" stroke-width="3"/>
  <circle cx="70" cy="70" r="45" fill="none" stroke="#f59e0b" stroke-width="1"/>
</svg>
`

export async function generateDonationCertificatePDF(data: DonationCertificateData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    const formattedDate = new Date(data.donationDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(data.amount)

    const html = generateDonationCertificateHTML({
      ...data,
      formattedDate,
      formattedAmount
    })

    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

function generateDonationCertificateHTML(data: DonationCertificateData & { formattedDate: string, formattedAmount: string }): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@400;500;600&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        width: 297mm;
        height: 210mm;
        font-family: 'Inter', Arial, sans-serif;
        position: relative;
        overflow: hidden;
        background: #f8f9fa;
      }

      .certificate-container {
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
      }

      /* Left decorative section */
      .left-section {
        width: 200px;
        background: linear-gradient(180deg, #1e3a5f 0%, #0f2744 50%, #1e3a5f 100%);
        position: relative;
        overflow: hidden;
      }

      .wave-overlay {
        position: absolute;
        top: 0;
        right: -80px;
        width: 160px;
        height: 100%;
        background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
        border-radius: 0 100% 100% 0 / 0 50% 50% 0;
      }

      .gold-ribbon {
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 100%;
        background: linear-gradient(180deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%);
      }

      .gold-curve {
        position: absolute;
        top: 50%;
        left: 20px;
        width: 120px;
        height: 300px;
        border: 4px solid #f59e0b;
        border-radius: 0 100% 100% 0;
        border-left: none;
        transform: translateY(-50%);
      }

      .ribbon-container {
        position: absolute;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
      }

      /* Main content section */
      .right-section {
        flex: 1;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        position: relative;
        padding: 40px 60px;
      }

      .content-frame {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        bottom: 20px;
        border: 3px solid #f59e0b;
        pointer-events: none;
      }

      .logo-container {
        position: absolute;
        top: 40px;
        right: 60px;
        text-align: center;
      }

      .logo-circle {
        width: 80px;
        height: 80px;
        margin: 0 auto;
      }

      .logo-text {
        margin-top: 8px;
        font-size: 12px;
        font-weight: 700;
        color: #1e3a5f;
        line-height: 1.2;
      }

      .logo-text .arpu {
        font-size: 16px;
        color: #1e3a5f;
      }

      .logo-text .subtitle {
        font-size: 10px;
        color: #f59e0b;
      }

      .certificate-header {
        text-align: center;
        padding-top: 30px;
        margin-bottom: 30px;
      }

      .certificate-title {
        font-family: 'Playfair Display', serif;
        font-size: 64px;
        font-weight: 700;
        font-style: italic;
        color: #1e3a5f;
        margin-bottom: 0;
      }

      .certificate-subtitle {
        font-family: 'Playfair Display', serif;
        font-size: 48px;
        font-weight: 600;
        font-style: italic;
        color: #1e3a5f;
        margin-top: -5px;
      }

      .certification-text {
        text-align: center;
        font-size: 18px;
        color: #374151;
        margin-bottom: 20px;
      }

      .donor-name {
        text-align: center;
        font-size: 36px;
        font-weight: 600;
        color: #1e3a5f;
        border-bottom: 3px solid #f59e0b;
        display: inline-block;
        padding: 0 40px 8px;
        margin-bottom: 25px;
      }

      .donor-name-container {
        text-align: center;
      }

      .description-text {
        text-align: center;
        font-size: 16px;
        color: #4b5563;
        line-height: 1.8;
        max-width: 700px;
        margin: 0 auto 15px;
      }

      .amount-highlight {
        text-align: center;
        font-size: 28px;
        font-weight: 700;
        color: #1e3a5f;
        margin: 15px 0;
      }

      .appreciation-text {
        text-align: center;
        font-size: 16px;
        color: #4b5563;
        line-height: 1.8;
        max-width: 650px;
        margin: 0 auto 30px;
      }

      .footer-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 30px;
        padding: 0 20px;
      }

      .footer-left {
        font-size: 13px;
        color: #6b7280;
      }

      .footer-left p {
        margin-bottom: 5px;
      }

      .footer-right {
        text-align: right;
        font-size: 13px;
        color: #6b7280;
      }

      .footer-right p {
        margin-bottom: 5px;
      }

      .signature-line {
        border-bottom: 1px solid #6b7280;
        width: 200px;
        display: inline-block;
        margin-left: 5px;
      }

      .signature-section {
        margin-top: 10px;
      }

      .bottom-accent {
        position: absolute;
        bottom: 0;
        left: 200px;
        right: 0;
        height: 60px;
        background: linear-gradient(90deg, transparent 0%, rgba(248, 250, 252, 0.8) 50%, transparent 100%);
      }

      .wave-bottom {
        position: absolute;
        bottom: 0;
        left: 200px;
        width: 200px;
        height: 80px;
        background: linear-gradient(180deg, transparent 0%, rgba(249, 168, 37, 0.1) 100%);
      }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <!-- Left decorative section -->
      <div class="left-section">
        <div class="wave-overlay"></div>
        <div class="gold-ribbon"></div>
        <div class="gold-curve"></div>
        <div class="ribbon-container">
          ${RIBBON_SVG}
        </div>
      </div>

      <!-- Right content section -->
      <div class="right-section">
        <div class="content-frame"></div>

        <!-- Logo -->
        <div class="logo-container">
          <div class="logo-circle">
            ${ARPU_LOGO_SVG}
          </div>
          <div class="logo-text">
            <div class="arpu">ARPU</div>
            <div class="subtitle">FUTURE RISE</div>
            <div class="subtitle">LIFE FOUNDATION</div>
          </div>
        </div>

        <!-- Certificate Content -->
        <div class="certificate-header">
          <h1 class="certificate-title">Certificate of</h1>
          <h2 class="certificate-subtitle">Appreciation</h2>
        </div>

        <p class="certification-text">This is to certify that</p>

        <div class="donor-name-container">
          <div class="donor-name">${data.donorName}</div>
        </div>

        <p class="description-text">
          has generously contributed to the initiatives of <strong>ARPU FUTURE RISE LIFE FOUNDATION</strong>,
          supporting our efforts in the fields of Social Welfare, Politics, Health, and Education,
          demonstrating exceptional commitment to public and national service.
        </p>

        <p class="amount-highlight">
          Donation Amount: ${data.formattedAmount}
        </p>

        <p class="appreciation-text">
          The foundation appreciates their dedication, spirit of generosity, and philanthropic qualities,
          and wishes them a bright future.
        </p>

        <!-- Footer -->
        <div class="footer-section">
          <div class="footer-left">
            <p>Place: <span class="signature-line">${data.place || 'India'}</span></p>
            <p>Certificate No: <span class="signature-line">${data.certificateNumber}</span></p>
            <p>Date: <span class="signature-line">${data.formattedDate}</span></p>
          </div>

          <div class="footer-right">
            <p>Name: <span class="signature-line">${data.signatureName || 'Authorized Signatory'}</span></p>
            <p>Designation: <span class="signature-line">${data.signatureDesignation || 'Secretary'}</span></p>
            <div class="signature-section">
              <p>Signature: <span class="signature-line"></span></p>
            </div>
          </div>
        </div>

        <div class="bottom-accent"></div>
        <div class="wave-bottom"></div>
      </div>
    </div>
  </body>
  </html>
  `
}

// Generate a unique certificate number for donations
export function generateDonationCertificateNumber(donationId: string, donationDate: Date): string {
  const date = new Date(donationDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const id = donationId.slice(-6).toUpperCase()
  return `ARPU-DON-${year}${month}${day}-${id}`
}
