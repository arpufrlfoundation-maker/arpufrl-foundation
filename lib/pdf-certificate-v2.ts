import puppeteer from 'puppeteer'
import { ICertificate, CertificateType } from '@/models/Certificate'

interface CertificateData {
  certificateNumber: string
  certificateType: CertificateType
  recipientName: string
  recipientDesignation?: string
  eventName?: string
  activityDescription?: string
  dateOfEvent?: Date
  placeOfEvent?: string
  membershipId?: string
  membershipStartDate?: Date
  membershipType?: string
  issueDate: Date
}

// ARPU Logo SVG - matches the organization logo exactly
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

// Ribbon/Medal SVG - exact match to the golden award ribbon in images
const RIBBON_SVG = `
<svg width="140" height="180" viewBox="0 0 140 180" xmlns="http://www.w3.org/2000/svg">
  <!-- Main ribbon circle (medal) -->
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

  <!-- Decorative ridges around medal -->
  <circle cx="70" cy="70" r="55" fill="none" stroke="#fbbf24" stroke-width="3"/>
  <circle cx="70" cy="70" r="45" fill="none" stroke="#f59e0b" stroke-width="1"/>

  <!-- Inner decorative pattern -->
  ${Array.from({length: 16}, (_, i) => {
    const angle = (i * 22.5) * Math.PI / 180
    const x1 = 70 + Math.cos(angle) * 35
    const y1 = 70 + Math.sin(angle) * 35
    const x2 = 70 + Math.cos(angle) * 45
    const y2 = 70 + Math.sin(angle) * 45
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f59e0b" stroke-width="2"/>`
  }).join('')}
</svg>
`

export async function generateCertificatePDF(certificate: ICertificate | CertificateData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    // Map certificate data
    const certData: CertificateData = 'certificateNumber' in certificate ? {
      certificateNumber: certificate.certificateNumber,
      certificateType: certificate.certificateType || CertificateType.APPRECIATION,
      recipientName: certificate.recipientName || (certificate as any).userName || '',
      recipientDesignation: certificate.recipientDesignation,
      eventName: certificate.eventName || (certificate as any).title,
      activityDescription: certificate.activityDescription || (certificate as any).description,
      dateOfEvent: certificate.dateOfEvent || (certificate as any).validFrom,
      placeOfEvent: certificate.placeOfEvent,
      membershipId: certificate.membershipId || certificate.certificateNumber,
      membershipStartDate: certificate.membershipStartDate || (certificate as any).validFrom,
      membershipType: certificate.membershipType || (certificate as any).additionalInfo?.membershipType,
      issueDate: certificate.issueDate || (certificate as any).createdAt || new Date()
    } : certificate

    let html = ''

    switch (certData.certificateType) {
      case CertificateType.APPRECIATION:
      case CertificateType.VOLUNTEER:
      case CertificateType.EVENT:
        html = generateAppreciationCertificateType1(certData)
        break
      case CertificateType.CONTRIBUTION:
        html = generateAppreciationCertificateType2(certData)
        break
      case CertificateType.MEMBERSHIP:
        html = generateMembershipCertificate(certData)
        break
      case CertificateType.CONTEST:
      default:
        html = generateAppreciationCertificateType1(certData)
    }

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

// Certificate Type 1 - Appreciation with event participation (matches Image 1)
function generateAppreciationCertificateType1(certData: CertificateData): string {
  const eventDate = certData.dateOfEvent
    ? new Date(certData.dateOfEvent).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '___________'

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

      /* Left decorative section - dark blue with gold accents */
      .left-section {
        width: 200px;
        background: linear-gradient(180deg, #1e3a5f 0%, #0f2744 50%, #1e3a5f 100%);
        position: relative;
        overflow: hidden;
      }

      /* Curved decorative wave overlay */
      .wave-overlay {
        position: absolute;
        top: 0;
        right: -80px;
        width: 160px;
        height: 100%;
        background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
        border-radius: 0 100% 100% 0 / 0 50% 50% 0;
      }

      /* Gold ribbon accent */
      .gold-ribbon {
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 100%;
        background: linear-gradient(180deg, #f59e0b 0%, #d97706 50%, #f59e0b 100%);
      }

      /* Decorative curved gold line */
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

      /* Award ribbon/medal */
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

      /* Orange border frame */
      .content-frame {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        bottom: 20px;
        border: 3px solid #f59e0b;
        pointer-events: none;
      }

      /* Logo in top right */
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

      /* Certificate title */
      .certificate-header {
        text-align: center;
        padding-top: 30px;
        margin-bottom: 30px;
      }

      .certificate-title {
        font-family: 'Playfair Display', serif;
        font-size: 72px;
        font-weight: 700;
        font-style: italic;
        color: #1e3a5f;
        margin-bottom: 0;
      }

      .certificate-subtitle {
        font-size: 24px;
        color: #1e3a5f;
        font-weight: 400;
        letter-spacing: 2px;
      }

      /* Certificate body */
      .certificate-body {
        text-align: center;
        padding: 20px 80px;
      }

      .certify-text {
        font-size: 18px;
        color: #475569;
        margin-bottom: 15px;
        font-style: italic;
      }

      .recipient-name {
        font-family: 'Playfair Display', serif;
        font-size: 36px;
        font-weight: 700;
        color: #1e3a5f;
        padding: 10px 30px;
        display: inline-block;
        min-width: 300px;
        border-bottom: 2px solid #1e3a5f;
        margin-bottom: 20px;
      }

      .description-text {
        font-size: 16px;
        color: #334155;
        line-height: 1.8;
        margin-bottom: 15px;
      }

      .event-line {
        color: #334155;
        font-size: 14px;
        margin: 5px 0;
        border-bottom: 1px solid #1e3a5f;
        display: inline-block;
        min-width: 350px;
        padding-bottom: 2px;
      }

      .org-name {
        font-weight: 700;
        color: #1e3a5f;
      }

      .appreciation-text {
        font-size: 15px;
        color: #475569;
        line-height: 1.7;
        margin: 25px auto;
        max-width: 700px;
      }

      /* Footer section */
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding: 20px 60px;
        margin-top: 30px;
      }

      .footer-left {
        text-align: left;
      }

      .footer-right {
        text-align: right;
      }

      .footer-item {
        margin: 8px 0;
        font-size: 13px;
        color: #334155;
      }

      .footer-label {
        display: inline-block;
        min-width: 80px;
      }

      .footer-value {
        border-bottom: 1px solid #334155;
        display: inline-block;
        min-width: 150px;
        padding-bottom: 2px;
      }

      .signature-section {
        margin-top: 15px;
      }

      .signature-line {
        width: 180px;
        border-bottom: 1px solid #334155;
        margin-bottom: 5px;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <div class="left-section">
        <div class="wave-overlay"></div>
        <div class="gold-ribbon"></div>
        <div class="gold-curve"></div>
        <div class="ribbon-container">
          ${RIBBON_SVG}
        </div>
      </div>

      <div class="right-section">
        <div class="content-frame"></div>

        <div class="logo-container">
          ${ARPU_LOGO_SVG}
          <div class="logo-text">
            <div class="arpu">ARPU</div>
            <div class="subtitle">FUTURE RISE</div>
            <div class="subtitle">LIFE FOUNDATION</div>
          </div>
        </div>

        <div class="certificate-header">
          <div class="certificate-title">Certificate</div>
          <div class="certificate-subtitle">of Appreciation</div>
        </div>

        <div class="certificate-body">
          <div class="certify-text">This is to certify that</div>

          <div class="recipient-name">${certData.recipientName || ''}</div>

          <p class="description-text">
            has actively participated in / rendered service during the
          </p>

          <div class="event-line">${certData.eventName || ''}</div>

          <p class="description-text">
            organized by <span class="org-name">ARPU FUTURE RISE LIFE FOUNDATION</span> on ${eventDate}
          </p>

          <p class="appreciation-text">
            This certificate is being awarded in recognition of their valuable
            contribution to social service, public welfare, training, or leadership.
            We extend our best wishes for their bright future.
          </p>
        </div>

        <div class="footer">
          <div class="footer-left">
            <div class="footer-item">
              <span class="footer-label">Date :</span>
              <span class="footer-value">${new Date(certData.issueDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Place :</span>
              <span class="footer-value">${certData.placeOfEvent || ''}</span>
            </div>
          </div>

          <div class="footer-right">
            <div class="footer-item">
              <span class="footer-label">Name :</span>
              <span class="footer-value"></span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Designation :</span>
              <span class="footer-value"></span>
            </div>
            <div class="signature-section">
              <div class="footer-item">
                <span class="footer-label">Signature :</span>
                <span class="footer-value"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

// Certificate Type 2 - Appreciation for contribution (matches Image 3)
function generateAppreciationCertificateType2(certData: CertificateData): string {
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
        width: 180px;
        background: linear-gradient(180deg, #1e3a5f 0%, #0f2744 50%, #1e3a5f 100%);
        position: relative;
        overflow: hidden;
      }

      .wave-overlay {
        position: absolute;
        top: 0;
        right: -100px;
        width: 200px;
        height: 100%;
        background: radial-gradient(ellipse at right, rgba(255,255,255,0.08) 0%, transparent 70%);
      }

      .gold-accent {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 200px;
        background: linear-gradient(180deg, transparent 0%, rgba(245,158,11,0.2) 100%);
      }

      .ribbon-container {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
      }

      .right-section {
        flex: 1;
        background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
        position: relative;
        padding: 40px 60px;
      }

      .content-frame {
        position: absolute;
        top: 25px;
        left: 25px;
        right: 25px;
        bottom: 25px;
        border: 3px solid #f59e0b;
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
        font-size: 11px;
        font-weight: 700;
        color: #1e3a5f;
        line-height: 1.3;
      }

      .logo-text .arpu {
        font-size: 14px;
      }

      .logo-text .subtitle {
        font-size: 9px;
        color: #f59e0b;
      }

      .certificate-header {
        text-align: center;
        padding-top: 20px;
        margin-bottom: 25px;
      }

      .certificate-title {
        font-family: 'Playfair Display', serif;
        font-size: 60px;
        font-weight: 700;
        font-style: italic;
        color: #1e3a5f;
      }

      .certificate-subtitle {
        font-size: 48px;
        color: #1e3a5f;
        font-weight: 700;
        font-family: 'Playfair Display', serif;
        font-style: italic;
      }

      .certificate-body {
        text-align: center;
        padding: 15px 60px;
      }

      .certify-text {
        font-size: 18px;
        color: #475569;
        margin-bottom: 10px;
        font-style: italic;
      }

      .recipient-name {
        font-family: 'Playfair Display', serif;
        font-size: 32px;
        font-weight: 700;
        color: #1e3a5f;
        padding: 8px 30px;
        display: inline-block;
        min-width: 280px;
        border-bottom: 3px solid #f59e0b;
        margin-bottom: 20px;
      }

      .description-text {
        font-size: 15px;
        color: #334155;
        line-height: 1.9;
        margin: 15px auto;
        max-width: 700px;
        text-align: center;
      }

      .org-name {
        font-weight: 700;
        color: #1e3a5f;
      }

      .appreciation-text {
        font-size: 15px;
        color: #475569;
        line-height: 1.8;
        margin: 20px auto;
        max-width: 650px;
        text-align: center;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding: 15px 50px;
        margin-top: 20px;
      }

      .footer-left, .footer-right {
        text-align: left;
      }

      .footer-item {
        margin: 6px 0;
        font-size: 12px;
        color: #334155;
      }

      .footer-label {
        display: inline-block;
        min-width: 100px;
      }

      .footer-value {
        border-bottom: 1px solid #334155;
        display: inline-block;
        min-width: 140px;
        padding-bottom: 2px;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <div class="left-section">
        <div class="wave-overlay"></div>
        <div class="gold-accent"></div>
        <div class="ribbon-container">
          ${RIBBON_SVG}
        </div>
      </div>

      <div class="right-section">
        <div class="content-frame"></div>

        <div class="logo-container">
          ${ARPU_LOGO_SVG}
          <div class="logo-text">
            <div class="arpu">ARPU</div>
            <div class="subtitle">FUTURE RISE</div>
            <div class="subtitle">LIFE FOUNDATION</div>
          </div>
        </div>

        <div class="certificate-header">
          <div class="certificate-title">Certificate of</div>
          <div class="certificate-subtitle">Appreciation</div>
        </div>

        <div class="certificate-body">
          <div class="certify-text">This is to certify that</div>

          <div class="recipient-name">${certData.recipientName || ''}</div>

          <p class="description-text">
            has actively contributed in the fields of Social Welfare, Politics, Health, and
            Education under the initiatives of <span class="org-name">ARPU FUTURE RISE LIFE FOUNDATION</span>,
            demonstrating exceptional commitment to public and national service.
          </p>

          <p class="appreciation-text">
            The foundation appreciates their dedication, spirit of service, and
            leadership qualities, and wishes them a bright future.
          </p>
        </div>

        <div class="footer">
          <div class="footer-left">
            <div class="footer-item">
              <span class="footer-label">Place:</span>
              <span class="footer-value">${certData.placeOfEvent || ''}</span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Certificate No:</span>
              <span class="footer-value">${certData.certificateNumber}</span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Date:</span>
              <span class="footer-value">${new Date(certData.issueDate).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          <div class="footer-right">
            <div class="footer-item">
              <span class="footer-label">Name:</span>
              <span class="footer-value"></span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Designation:</span>
              <span class="footer-value"></span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Signature:</span>
              <span class="footer-value"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

// Membership Certificate (matches Image 2)
function generateMembershipCertificate(certData: CertificateData): string {
  const effectiveDate = certData.membershipStartDate
    ? new Date(certData.membershipStartDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '___________'

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

      .left-section {
        width: 200px;
        background: linear-gradient(180deg, #0c4a6e 0%, #0369a1 50%, #0c4a6e 100%);
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
        bottom: 0;
        left: 0;
        width: 150px;
        height: 250px;
        border: 4px solid #f59e0b;
        border-radius: 100% 0 0 0;
        border-right: none;
        border-bottom: none;
      }

      .ribbon-container {
        position: absolute;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
      }

      .right-section {
        flex: 1;
        background: linear-gradient(135deg, #ecfeff 0%, #f0f9ff 50%, #ffffff 100%);
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
        color: #0c4a6e;
        line-height: 1.2;
      }

      .logo-text .arpu {
        font-size: 16px;
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
        font-size: 60px;
        font-weight: 700;
        font-style: italic;
        color: #0c4a6e;
        line-height: 1.1;
      }

      .certificate-subtitle {
        font-size: 48px;
        color: #0c4a6e;
        font-weight: 700;
        font-family: 'Playfair Display', serif;
        font-style: italic;
      }

      .certificate-body {
        text-align: center;
        padding: 20px 80px;
      }

      .certify-text {
        font-size: 18px;
        color: #475569;
        margin-bottom: 15px;
        font-style: italic;
      }

      .recipient-name {
        font-family: 'Playfair Display', serif;
        font-size: 36px;
        font-weight: 700;
        color: #0c4a6e;
        padding: 10px 30px;
        display: inline-block;
        min-width: 300px;
        border-bottom: 2px solid #0c4a6e;
        margin-bottom: 20px;
      }

      .membership-text {
        font-size: 15px;
        color: #334155;
        line-height: 1.8;
        margin: 15px auto;
        max-width: 700px;
      }

      .membership-type {
        border-bottom: 1px solid #0c4a6e;
        display: inline-block;
        min-width: 150px;
        padding: 0 10px;
      }

      .org-name {
        font-weight: 700;
        color: #0c4a6e;
      }

      .appreciation-text {
        font-size: 15px;
        color: #475569;
        line-height: 1.8;
        margin: 25px auto;
        max-width: 650px;
      }

      .appreciation-text-bold {
        font-size: 16px;
        color: #0c4a6e;
        font-weight: 600;
        margin-top: 20px;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding: 20px 60px;
        margin-top: 25px;
      }

      .footer-left, .footer-right {
        text-align: left;
      }

      .footer-item {
        margin: 8px 0;
        font-size: 13px;
        color: #334155;
      }

      .footer-label {
        display: inline-block;
        min-width: 110px;
      }

      .footer-value {
        border-bottom: 1px solid #334155;
        display: inline-block;
        min-width: 130px;
        padding-bottom: 2px;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  </head>
  <body>
    <div class="certificate-container">
      <div class="left-section">
        <div class="wave-overlay"></div>
        <div class="gold-ribbon"></div>
        <div class="gold-curve"></div>
        <div class="ribbon-container">
          ${RIBBON_SVG}
        </div>
      </div>

      <div class="right-section">
        <div class="content-frame"></div>

        <div class="logo-container">
          ${ARPU_LOGO_SVG}
          <div class="logo-text">
            <div class="arpu">ARPU</div>
            <div class="subtitle">FUTURE RISE</div>
            <div class="subtitle">LIFE FOUNDATION</div>
          </div>
        </div>

        <div class="certificate-header">
          <div class="certificate-title">Membership</div>
          <div class="certificate-subtitle">Certificate</div>
        </div>

        <div class="certificate-body">
          <div class="certify-text">This is to certify that</div>

          <div class="recipient-name">${certData.recipientName || ''}</div>

          <p class="membership-text">
            is hereby recognized as an<span class="membership-type">${certData.membershipType || 'Active'}</span> Member of<br>
            <span class="org-name">ARPU FUTURE RISE LIFE FOUNDATION</span> effective from ${effectiveDate}
          </p>

          <p class="appreciation-text">
            As a member, they are committed to contributing actively to the
            objectives of the organization and are entitled to participate in all
            its activities, initiatives, and special events.
          </p>

          <p class="appreciation-text-bold">
            The organization appreciates their sense of social responsibility,
            service spirit, and dedication
          </p>
        </div>

        <div class="footer">
          <div class="footer-left">
            <div class="footer-item">
              <span class="footer-label">Membership ID:</span>
              <span class="footer-value">${certData.membershipId || certData.certificateNumber}</span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Issue Date:</span>
              <span class="footer-value">${new Date(certData.issueDate).toLocaleDateString('en-IN')}</span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Place:</span>
              <span class="footer-value">${certData.placeOfEvent || ''}</span>
            </div>
          </div>

          <div class="footer-right">
            <div class="footer-item">
              <span class="footer-label">Name:</span>
              <span class="footer-value"></span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Designation:</span>
              <span class="footer-value"></span>
            </div>
            <div class="footer-item">
              <span class="footer-label">Signature:</span>
              <span class="footer-value"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

export type { CertificateData }
