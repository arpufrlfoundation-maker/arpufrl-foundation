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

export async function generateCertificatePDF(certData: CertificateData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()

    let html = ''

    switch (certData.certificateType) {
      case CertificateType.APPRECIATION:
      case CertificateType.CONTRIBUTION:
        html = generateAppreciationCertificate(certData)
        break
      case CertificateType.MEMBERSHIP:
        html = generateMembershipCertificate(certData)
        break
      case CertificateType.VOLUNTEER:
      case CertificateType.EVENT:
      case CertificateType.CONTEST:
        html = generateGeneralAppreciationCertificate(certData)
        break
      default:
        html = generateAppreciationCertificate(certData)
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

function generateAppreciationCertificate(certData: CertificateData): string {
  const description = certData.certificateType === CertificateType.CONTRIBUTION
    ? `has actively contributed in the fields of Social Welfare, Politics, Health, and Education under the initiatives of <strong>ARPU FUTURE RISE LIFE FOUNDATION</strong>, demonstrating exceptional commitment to public and national service.`
    : `has actively participated in / rendered service during the<br><strong>${certData.eventName || '___________________________'}</strong><br>organized by <strong>ARPU FUTURE RISE LIFE FOUNDATION</strong> on <strong>${certData.dateOfEvent ? new Date(certData.dateOfEvent).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '_________________'}</strong>`

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
        background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1e3a8a 100%);
      }

      .certificate-container {
        width: 100%;
        height: 100%;
        position: relative;
        padding: 0;
        display: flex;
      }

      .left-section {
        width: 220px;
        background: linear-gradient(180deg, #1e3a8a 0%, #3b82f6 100%);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        border-right: 6px solid #f59e0b;
      }

      .ribbon-decoration {
        position: absolute;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
      }

      .ribbon {
        width: 120px;
        height: 120px;
        position: relative;
      }

      .ribbon-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, #fbbf24 0%, #f59e0b 100%);
        position: absolute;
        top: 10px;
        left: 10px;
        border: 8px solid #fef3c7;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      }

      .ribbon-tails {
        position: absolute;
        bottom: -40px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 50px;
      }

      .ribbon-tail {
        width: 25px;
        height: 50px;
        background: #f59e0b;
        position: absolute;
        bottom: 0;
      }

      .ribbon-tail:first-child {
        left: 0;
        clip-path: polygon(0 0, 100% 0, 50% 100%);
      }

      .ribbon-tail:last-child {
        right: 0;
        clip-path: polygon(0 0, 100% 0, 50% 100%);
      }

      .logo-section {
        margin-top: 220px;
        text-align: center;
      }

      .logo {
        width: 120px;
        height: 120px;
        margin: 0 auto 20px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        padding: 15px;
      }

      .org-name-vertical {
        color: white;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.8;
        text-align: center;
        margin-top: 30px;
        letter-spacing: 1px;
      }

      .right-section {
        flex: 1;
        background: white;
        padding: 50px 80px;
        position: relative;
        border: 8px solid #f59e0b;
        margin: 15px 15px 15px 0;
      }

      .corner-decoration {
        position: absolute;
        width: 80px;
        height: 80px;
      }

      .corner-top-right {
        top: -8px;
        right: -8px;
        border-top: 8px solid #2563eb;
        border-right: 8px solid #2563eb;
      }

      .corner-bottom-left {
        bottom: -8px;
        left: -8px;
        border-bottom: 8px solid #2563eb;
        border-left: 8px solid #2563eb;
      }

      .certificate-header {
        text-align: center;
        margin-bottom: 35px;
      }

      .certificate-title {
        font-family: 'Playfair Display', serif;
        font-size: 56px;
        font-weight: 900;
        color: #1e3a8a;
        margin-bottom: 5px;
        letter-spacing: 3px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      }

      .certificate-subtitle {
        font-size: 20px;
        color: #64748b;
        font-weight: 500;
        letter-spacing: 4px;
      }

      .certificate-body {
        text-align: center;
        margin-bottom: 35px;
      }

      .certify-text {
        font-size: 18px;
        color: #334155;
        margin-bottom: 25px;
        line-height: 1.6;
      }

      .recipient-name {
        font-family: 'Playfair Display', serif;
        font-size: 48px;
        font-weight: 700;
        color: #1e3a8a;
        margin: 25px 0;
        padding: 15px 0;
        border-top: 3px solid #f59e0b;
        border-bottom: 3px solid #f59e0b;
        letter-spacing: 2px;
      }

      .description {
        font-size: 16px;
        color: #475569;
        line-height: 1.9;
        margin: 25px auto;
        max-width: 750px;
      }

      .appreciation-text {
        font-size: 17px;
        color: #1e3a8a;
        margin-top: 30px;
        line-height: 1.7;
        font-weight: 500;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 45px;
        padding-top: 25px;
        border-top: 2px solid #e2e8f0;
      }

      .footer-item {
        text-align: center;
        flex: 1;
      }

      .footer-label {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 5px;
      }

      .footer-value {
        font-size: 14px;
        color: #1e293b;
        font-weight: 600;
      }

      .signature-line {
        width: 200px;
        border-top: 2px solid #1e293b;
        margin: 35px auto 8px;
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
        <div class="ribbon-decoration">
          <div class="ribbon">
            <div class="ribbon-circle"></div>
            <div class="ribbon-tails">
              <div class="ribbon-tail"></div>
              <div class="ribbon-tail"></div>
            </div>
          </div>
        </div>

        <div class="logo-section">
          <div class="logo">
            <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="#1e3a8a"/>
              <path d="M50 25 L55 40 L70 40 L58 50 L63 65 L50 55 L37 65 L42 50 L30 40 L45 40 Z" fill="#fbbf24"/>
            </svg>
          </div>
          <div class="org-name-vertical">
            <div>ARPU</div>
            <div>FUTURE RISE</div>
            <div>LIFE</div>
            <div>FOUNDATION</div>
          </div>
        </div>
      </div>

      <div class="right-section">
        <div class="corner-decoration corner-top-right"></div>
        <div class="corner-decoration corner-bottom-left"></div>

        <div class="certificate-header">
          <div class="certificate-title">Certificate</div>
          <div class="certificate-subtitle">of Appreciation</div>
        </div>

        <div class="certificate-body">
          <div class="certify-text">This is to certify that</div>

          <div class="recipient-name">${certData.recipientName}</div>

          <div class="description">
            ${description}
          </div>

          <div class="appreciation-text">
            The foundation appreciates their dedication, spirit of service, and<br>
            leadership qualities, and wishes them a bright future.
          </div>
        </div>

        <div class="footer">
          <div class="footer-item">
            <div class="footer-label">Place:</div>
            <div class="footer-value">${certData.placeOfEvent || '_________________'}</div>
          </div>
          <div class="footer-item">
            <div class="footer-label">Certificate No:</div>
            <div class="footer-value">${certData.certificateNumber}</div>
          </div>
          <div class="footer-item">
            <div class="footer-label">Date:</div>
            <div class="footer-value">${new Date(certData.issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <div style="text-align: right; margin-top: 30px;">
          <div class="signature-line"></div>
          <div style="font-size: 13px; color: #64748b; margin-top: 5px;">Authorized Signatory</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

function generateMembershipCertificate(certData: CertificateData): string {
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
        background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0c4a6e 100%);
      }

      .certificate-container {
        width: 100%;
        height: 100%;
        position: relative;
        padding: 0;
        display: flex;
      }

      .left-section {
        width: 220px;
        background: linear-gradient(180deg, #0c4a6e 0%, #0ea5e9 100%);
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 20px;
        border-right: 6px solid #f59e0b;
      }

      .ribbon-decoration {
        position: absolute;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
      }

      .ribbon {
        width: 120px;
        height: 120px;
        position: relative;
      }

      .ribbon-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, #fbbf24 0%, #f59e0b 100%);
        position: absolute;
        top: 10px;
        left: 10px;
        border: 8px solid #fef3c7;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
      }

      .ribbon-tails {
        position: absolute;
        bottom: -40px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 50px;
      }

      .ribbon-tail {
        width: 25px;
        height: 50px;
        background: #f59e0b;
        position: absolute;
        bottom: 0;
      }

      .ribbon-tail:first-child {
        left: 0;
        clip-path: polygon(0 0, 100% 0, 50% 100%);
      }

      .ribbon-tail:last-child {
        right: 0;
        clip-path: polygon(0 0, 100% 0, 50% 100%);
      }

      .logo-section {
        margin-top: 220px;
        text-align: center;
      }

      .logo {
        width: 120px;
        height: 120px;
        margin: 0 auto 20px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        padding: 15px;
      }

      .org-name-vertical {
        color: white;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.8;
        text-align: center;
        margin-top: 30px;
        letter-spacing: 1px;
      }

      .right-section {
        flex: 1;
        background: white;
        padding: 50px 80px;
        position: relative;
        border: 8px solid #f59e0b;
        margin: 15px 15px 15px 0;
      }

      .corner-decoration {
        position: absolute;
        width: 80px;
        height: 80px;
      }

      .corner-top-right {
        top: -8px;
        right: -8px;
        border-top: 8px solid #0369a1;
        border-right: 8px solid #0369a1;
      }

      .corner-bottom-left {
        bottom: -8px;
        left: -8px;
        border-bottom: 8px solid #0369a1;
        border-left: 8px solid #0369a1;
      }

      .certificate-header {
        text-align: center;
        margin-bottom: 35px;
      }

      .certificate-title {
        font-family: 'Playfair Display', serif;
        font-size: 50px;
        font-weight: 900;
        color: #0c4a6e;
        margin-bottom: 5px;
        letter-spacing: 2px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      }

      .certificate-subtitle {
        font-size: 18px;
        color: #64748b;
        font-weight: 500;
        letter-spacing: 3px;
      }

      .certificate-body {
        text-align: center;
        margin-bottom: 35px;
      }

      .certify-text {
        font-size: 18px;
        color: #334155;
        margin-bottom: 25px;
        line-height: 1.6;
      }

      .recipient-name {
        font-family: 'Playfair Display', serif;
        font-size: 48px;
        font-weight: 700;
        color: #0c4a6e;
        margin: 25px 0;
        padding: 15px 0;
        border-top: 3px solid #f59e0b;
        border-bottom: 3px solid #f59e0b;
        letter-spacing: 2px;
      }

      .membership-info {
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        padding: 25px;
        border-radius: 12px;
        margin: 30px 0;
        border-left: 5px solid #0369a1;
      }

      .membership-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-top: 15px;
      }

      .detail-item {
        text-align: left;
      }

      .detail-label {
        font-size: 13px;
        color: #64748b;
        margin-bottom: 4px;
      }

      .detail-value {
        font-size: 16px;
        font-weight: 600;
        color: #0c4a6e;
      }

      .description {
        font-size: 16px;
        color: #475569;
        line-height: 1.9;
        margin: 25px auto;
        max-width: 750px;
      }

      .membership-text {
        font-size: 15px;
        color: #0c4a6e;
        margin-top: 25px;
        line-height: 1.8;
        font-weight: 500;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-top: 40px;
        padding-top: 25px;
        border-top: 2px solid #e2e8f0;
      }

      .footer-item {
        text-align: center;
        flex: 1;
      }

      .footer-label {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 5px;
      }

      .footer-value {
        font-size: 14px;
        color: #1e293b;
        font-weight: 600;
      }

      .signature-line {
        width: 200px;
        border-top: 2px solid #1e293b;
        margin: 35px auto 8px;
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
        <div class="ribbon-decoration">
          <div class="ribbon">
            <div class="ribbon-circle"></div>
            <div class="ribbon-tails">
              <div class="ribbon-tail"></div>
              <div class="ribbon-tail"></div>
            </div>
          </div>
        </div>

        <div class="logo-section">
          <div class="logo">
            <svg width="90" height="90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="#0c4a6e"/>
              <path d="M50 25 L55 40 L70 40 L58 50 L63 65 L50 55 L37 65 L42 50 L30 40 L45 40 Z" fill="#fbbf24"/>
            </svg>
          </div>
          <div class="org-name-vertical">
            <div>ARPU</div>
            <div>FUTURE RISE</div>
            <div>LIFE</div>
            <div>FOUNDATION</div>
          </div>
        </div>
      </div>

      <div class="right-section">
        <div class="corner-decoration corner-top-right"></div>
        <div class="corner-decoration corner-bottom-left"></div>

        <div class="certificate-header">
          <div class="certificate-title">Membership</div>
          <div class="certificate-title">Certificate</div>
        </div>

        <div class="certificate-body">
          <div class="certify-text">This is to certify that</div>

          <div class="recipient-name">${certData.recipientName}</div>

          <div class="membership-info">
            <div style="text-align: center; font-size: 18px; font-weight: 600; color: #0c4a6e; margin-bottom: 15px;">
              is hereby recognized as an <span style="color: #f59e0b;">${certData.membershipType || '___________________'}</span> Member of<br>
              <strong>ARPU FUTURE RISE LIFE FOUNDATION</strong> effective from <strong>${certData.membershipStartDate ? new Date(certData.membershipStartDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '__________'}</strong>
            </div>

            <div class="membership-details">
              <div class="detail-item">
                <div class="detail-label">Membership ID:</div>
                <div class="detail-value">${certData.membershipId || '___________'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Issue Date:</div>
                <div class="detail-value">${new Date(certData.issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              ${certData.recipientDesignation ? `
              <div class="detail-item">
                <div class="detail-label">Designation:</div>
                <div class="detail-value">${certData.recipientDesignation}</div>
              </div>
              ` : ''}
            </div>
          </div>

          <div class="membership-text">
            As a member, they are committed to contributing actively to the<br>
            objectives of the organization and are entitled to participate in all<br>
            its activities, initiatives, and special events.
          </div>

          <div class="membership-text" style="margin-top: 20px;">
            The organization appreciates their sense of social responsibility,<br>
            service spirit, and dedication
          </div>
        </div>

        <div class="footer">
          <div class="footer-item">
            <div class="footer-label">Place:</div>
            <div class="footer-value">${certData.placeOfEvent || '_________________'}</div>
          </div>
          <div class="footer-item">
            <div class="signature-line"></div>
            <div style="font-size: 13px; color: #64748b; margin-top: 5px;">Signature</div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `
}

function generateGeneralAppreciationCertificate(certData: CertificateData): string {
  // This is identical to appreciation certificate - can be used for Volunteer, Event, Contest
  return generateAppreciationCertificate(certData)
}
