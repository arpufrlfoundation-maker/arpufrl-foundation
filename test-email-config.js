const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  console.log('Testing email configuration...\n');
  
  // Display configuration (hiding password)
  console.log('Configuration:');
  console.log('- Host:', process.env.EMAIL_SERVER_HOST);
  console.log('- Port:', process.env.EMAIL_SERVER_PORT);
  console.log('- User:', process.env.EMAIL_SERVER_USER);
  console.log('- Password:', process.env.EMAIL_SERVER_PASSWORD ? '✓ Set (hidden)' : '✗ Not set');
  console.log('- From:', process.env.EMAIL_FROM);
  console.log();

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  try {
    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✓ SMTP connection successful!\n');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_SERVER_USER, // Sending to yourself
      subject: 'Test Email - ARPUFRL',
      text: 'This is a test email from your ARPUFRL application.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #2563eb;">Test Email Successful! 🎉</h2>
            <p>Your email configuration is working correctly.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>Host: ${process.env.EMAIL_SERVER_HOST}</li>
              <li>Port: ${process.env.EMAIL_SERVER_PORT}</li>
              <li>User: ${process.env.EMAIL_SERVER_USER}</li>
            </ul>
            <p style="margin-top: 20px; color: #666;">
              This email was sent from your ARPUFRL application to test the email functionality.
            </p>
          </div>
        </div>
      `,
    });

    console.log('✓ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n✅ Email configuration is working properly!');
    console.log('Check your inbox at:', process.env.EMAIL_SERVER_USER);
  } catch (error) {
    console.error('✗ Email test failed:');
    console.error(error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n⚠️  Invalid credentials. Please check:');
      console.log('1. Your email address is correct');
      console.log('2. You are using an App Password (not your regular Gmail password)');
      console.log('3. 2-Step Verification is enabled on your Gmail account');
      console.log('\nTo generate an App Password:');
      console.log('1. Go to https://myaccount.google.com/security');
      console.log('2. Enable 2-Step Verification if not already enabled');
      console.log('3. Go to https://myaccount.google.com/apppasswords');
      console.log('4. Generate a new app password for "Mail"');
      console.log('5. Use that 16-character password in your .env.local file');
    }
  }
}

testEmail();
