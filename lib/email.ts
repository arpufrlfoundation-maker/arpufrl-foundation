import nodemailer from 'nodemailer'

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig)
  }
  return transporter
}

// Verify email configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      console.warn('Email configuration missing. Emails will not be sent.')
      return false
    }
    const transport = getTransporter()
    await transport.verify()
    console.log('Email server is ready to send emails')
    return true
  } catch (error) {
    console.error('Email configuration error:', error)
    return false
  }
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

/**
 * Send an email
 */
export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      console.warn('Email not configured. Skipping email send.')
      return false
    }

    const transport = getTransporter()

    await transport.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    })

    console.log(`Email sent successfully to ${options.to}`)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

/**
 * Send donation confirmation email to donor
 */
export const sendDonationConfirmationEmail = async (
  donorEmail: string,
  donorName: string,
  amount: number,
  programName: string,
  donationId: string,
  razorpayPaymentId?: string,
  referralCode?: string,
  referralCoordinatorName?: string
): Promise<boolean> => {
  const subject = 'Thank You for Your Donation! 🙏'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-left: 4px solid #667eea;
          border-right: 4px solid #667eea;
        }
        .donation-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #555;
        }
        .detail-value {
          color: #333;
          text-align: right;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          text-align: center;
          margin: 20px 0;
        }
        .footer {
          background: #333;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #667eea;
          color: white !important;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: 600;
        }
        .thank-you {
          text-align: center;
          font-size: 18px;
          color: #667eea;
          font-weight: 600;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🙏 Thank You for Your Donation!</h1>
      </div>

      <div class="content">
        <p>Dear <strong>${donorName}</strong>,</p>

        <p>Thank you for your generous donation to <strong>Samarpan Sahayog Abhiyan</strong>. Your contribution makes a real difference in the lives of those we serve.</p>

        <div class="amount">₹${amount.toLocaleString('en-IN')}</div>

        <div class="donation-details">
          <h3 style="margin-top: 0; color: #667eea;">Donation Details</h3>

          <div class="detail-row">
            <span class="detail-label">Program:</span>
            <span class="detail-value">${programName}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value">₹${amount.toLocaleString('en-IN')}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Donation ID:</span>
            <span class="detail-value">${donationId}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Payment ID:</span>
            <span class="detail-value">${razorpayPaymentId || 'N/A'}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${new Date().toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>

          ${referralCode ? `
          <div class="detail-row" style="background-color: #f0f9ff; padding: 12px; border-radius: 6px; margin-top: 10px;">
            <span class="detail-label" style="color: #0369a1;">Referral Code Used:</span>
            <span class="detail-value" style="color: #0369a1; font-weight: bold;">${referralCode}</span>
          </div>
          ${referralCoordinatorName ? `
          <div class="detail-row" style="background-color: #f0f9ff; padding: 12px; border-radius: 6px;">
            <span class="detail-label" style="color: #0369a1;">Referred By:</span>
            <span class="detail-value" style="color: #0369a1;">${referralCoordinatorName}</span>
          </div>
          ` : ''}
          <p style="font-size: 13px; color: #0369a1; margin-top: 10px; padding: 10px; background-color: #e0f2fe; border-radius: 6px;">
            <strong>Thank you for using a referral code!</strong> Your donation supports our coordinator network and helps us reach more people in need.
          </p>
          ` : ''}
        </div>

        <div class="thank-you">
          Your donation is making a difference! 💚
        </div>

        <p style="margin-top: 30px;">
          <strong>Tax Benefits:</strong><br>
          Your donation is eligible for tax deduction under Section 80G of the Income Tax Act. An official receipt will be sent to you shortly.
        </p>

        <p style="text-align: center;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/donate" class="button">
            Donate Again
          </a>
        </p>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If you have any questions about your donation, please contact us at
          <a href="mailto:support@arpufrl.org" style="color: #667eea;">support@arpufrl.org</a>
        </p>
      </div>

      <div class="footer">
        <p style="margin: 5px 0;">
          <strong>Samarpan Sahayog Abhiyan</strong>
        </p>
        <p style="margin: 5px 0; font-size: 12px;">
          Making a difference, one donation at a time.
        </p>
        <p style="margin: 15px 0 5px 0; font-size: 12px;">
          © ${new Date().getFullYear()} Samarpan Sahayog Abhiyan. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `

  const text = `
    Thank You for Your Donation!

    Dear ${donorName},

    Thank you for your generous donation of ₹${amount.toLocaleString('en-IN')} to ${programName}.

    Donation Details:
    - Program: ${programName}
    - Amount: ₹${amount.toLocaleString('en-IN')}
    - Donation ID: ${donationId}
    - Payment ID: ${razorpayPaymentId}
    ${referralCode ? `- Referral Code: ${referralCode}` : ''}
    ${referralCoordinatorName ? `- Referred By: ${referralCoordinatorName}` : ''}
    - Date: ${new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}
    - Date: ${new Date().toLocaleDateString('en-IN')}

    Your donation is eligible for tax deduction under Section 80G.

    Thank you for making a difference!

    Best regards,
    Samarpan Sahayog Abhiyan
  `

  return await sendEmail({
    to: donorEmail,
    subject,
    html,
    text,
  })
}

/**
 * Send donation notification email to admin
 */
export const sendDonationNotificationToAdmin = async (
  donorName: string,
  amount: number,
  programName: string,
  donationId: string
): Promise<boolean> => {
  const adminEmail = process.env.EMAIL_SERVER_USER || 'admin@arpufrl.org'
  const subject = `New Donation Received: ₹${amount.toLocaleString('en-IN')}`

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #667eea;">🎉 New Donation Received!</h2>

      <p>A new donation has been received through the website.</p>

      <div style="background: #f4f4f4; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
        <p><strong>Donor:</strong> ${donorName}</p>
        <p><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
        <p><strong>Program:</strong> ${programName}</p>
        <p><strong>Donation ID:</strong> ${donationId}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString('en-IN')}</p>
      </div>

      <p>Please log in to the admin dashboard to view more details.</p>

      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        This is an automated notification from Samarpan Sahayog Abhiyan.
      </p>
    </body>
    </html>
  `

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
  })
}

/**
 * Send referral notification email to coordinator
 */
export const sendReferralNotificationToCoordinator = async (
  coordinatorEmail: string,
  coordinatorName: string,
  donorName: string,
  amount: number,
  programName: string,
  referralCode: string
): Promise<boolean> => {
  const subject = `🎯 Your Referral Code Was Used! ₹${amount.toLocaleString('en-IN')} Donation`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-left: 4px solid #10b981;
          border-right: 4px solid #10b981;
        }
        .referral-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e0e0e0;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #555;
        }
        .detail-value {
          color: #333;
          text-align: right;
        }
        .amount {
          font-size: 32px;
          font-weight: bold;
          color: #10b981;
          text-align: center;
          margin: 20px 0;
        }
        .footer {
          background: #333;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
          font-size: 12px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: 600;
          margin-top: 20px;
        }
        .highlight {
          background: #fef3c7;
          padding: 15px;
          border-left: 4px solid #f59e0b;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 Referral Success!</h1>
      </div>

      <div class="content">
        <p>Dear ${coordinatorName},</p>

        <p>Great news! Your referral code <strong>${referralCode}</strong> was just used for a donation.</p>

        <div class="amount">
          ₹${amount.toLocaleString('en-IN')}
        </div>

        <div class="referral-details">
          <div class="detail-row">
            <span class="detail-label">Donor Name:</span>
            <span class="detail-value">${donorName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Amount:</span>
            <span class="detail-value">₹${amount.toLocaleString('en-IN')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Program:</span>
            <span class="detail-value">${programName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Referral Code:</span>
            <span class="detail-value">${referralCode}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${new Date().toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="highlight">
          <strong>💡 Impact:</strong> This donation will be tracked in your referral statistics and may contribute to your commission calculations.
        </div>

        <p>Keep up the great work spreading awareness about Samarpan Sahayog Abhiyan!</p>

        <div style="text-align: center;">
          <a href="${process.env.NEXTAUTH_URL || 'https://arpufrl.org'}/dashboard" class="button">View Dashboard</a>
        </div>
      </div>

      <div class="footer">
        <p>This is an automated notification from Samarpan Sahayog Abhiyan</p>
        <p>© ${new Date().getFullYear()} Samarpan Sahayog Abhiyan. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const text = `
    Referral Success!

    Dear ${coordinatorName},

    Great news! Your referral code ${referralCode} was just used for a donation.

    Referral Details:
    - Donor: ${donorName}
    - Amount: ₹${amount.toLocaleString('en-IN')}
    - Program: ${programName}
    - Referral Code: ${referralCode}
    - Date: ${new Date().toLocaleString('en-IN')}

    This donation will be tracked in your referral statistics and may contribute to your commission calculations.

    Keep up the great work!

    Best regards,
    Samarpan Sahayog Abhiyan
  `

  return await sendEmail({
    to: coordinatorEmail,
    subject,
    html,
    text,
  })
}

export default {
  sendEmail,
  sendDonationConfirmationEmail,
  sendDonationNotificationToAdmin,
  sendReferralNotificationToCoordinator,
  verifyEmailConfig,
}
