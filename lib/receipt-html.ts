// Generate professional HTML receipt for donations
export function generateReceiptHTML(data: {
  receiptNumber: string
  donorName: string
  donorEmail: string
  amount: number
  programName: string
  donationDate: Date
  paymentId: string
  donationId: any
  referralCode?: string
  organizationName: string
  taxDeductionNote: string
  currency: string
}) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Donation Receipt</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .receipt-container { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 32px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .amount-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0; }
    .amount-box .amount { font-size: 42px; font-weight: bold; }
    .section { margin-bottom: 30px; }
    .section h3 { color: #667eea; margin-bottom: 15px; }
    .tax-note { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 2px solid #e0e0e0; }
    @media print { body { background: white; } .receipt-container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="header">
      <h1>🙏 DONATION RECEIPT 🙏</h1>
      <div>Receipt No: ${data.receiptNumber}</div>
    </div>
    <div class="content">
      <h2 style="color: #667eea;">Thank You for Your Generosity!</h2>
      <p>We sincerely appreciate your support for <strong>${data.organizationName}</strong>. Your contribution helps us make a meaningful difference.</p>
      
      <div class="amount-box">
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Donation Amount</div>
        <div class="amount">₹${data.amount.toLocaleString('en-IN')}</div>
      </div>

      <div class="section">
        <h3>Donor Information</h3>
        <p><strong>Name:</strong> ${data.donorName}</p>
        <p><strong>Email:</strong> ${data.donorEmail}</p>
      </div>

      <div class="section">
        <h3>Donation Details</h3>
        <p><strong>Program:</strong> ${data.programName}</p>
        <p><strong>Amount:</strong> ₹${data.amount.toLocaleString('en-IN')} ${data.currency}</p>
        <p><strong>Date:</strong> ${new Date(data.donationDate).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        ${data.referralCode ? `<p><strong>Referral Code:</strong> ${data.referralCode}</p>` : ''}
      </div>

      <div class="section">
        <h3>Transaction Details</h3>
        <p><strong>Receipt Number:</strong> ${data.receiptNumber}</p>
        <p><strong>Payment ID:</strong> ${data.paymentId}</p>
        <p><strong>Donation ID:</strong> ${data.donationId}</p>
      </div>

      <div class="tax-note">
        <strong>📋 Tax Deduction Information</strong><br>
        ${data.taxDeductionNote}
      </div>

      <p style="font-size: 14px; color: #888; margin-top: 30px; line-height: 1.8;">
        <strong>Note:</strong> This is a computer-generated receipt. Please keep this for your tax records. 
        For queries, contact us at <a href="mailto:info@arpufrl.org" style="color: #667eea;">info@arpufrl.org</a> quoting the receipt number.
      </p>
    </div>

    <div class="footer">
      <p style="font-size: 18px; font-weight: 600; color: #667eea; margin-bottom: 10px;">${data.organizationName}</p>
      <p>Making a difference, one contribution at a time</p>
      <p style="font-size: 13px; color: #888; margin-top: 15px;">
        Email: info@arpufrl.org | Website: www.arpufrl.org<br>
        © ${new Date().getFullYear()} ${data.organizationName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`

  return html
}
