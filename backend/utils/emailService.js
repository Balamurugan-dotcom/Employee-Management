const nodemailer = require('nodemailer');

/**
 * Send Password Reset OTP Email
 * @param {string} toEmail - Recipient email address
 * @param {string} userName - Name of the user/employee
 * @param {string} otp - 6-digit OTP code
 */
const sendOtpEmail = async (toEmail, userName, otp) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log('\n⚠️ [EMAIL SERVICE NOTICE]');
    console.log('EMAIL_USER and/or EMAIL_PASS not yet configured in backend/.env.');
    console.log(`To deliver real emails, add your Gmail App Password to backend/.env.`);
    console.log(`Current OTP for ${userName} (${toEmail}): >>> ${otp} <<<\n`);
    return {
      sent: false,
      reason: 'EMAIL_CREDENTIALS_MISSING',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser.trim(),
        pass: emailPass.replace(/\s+/g, '').trim(), // Remove spaces if copied with spaces
      },
    });

    const mailOptions = {
      from: `"TalentFlow EMS Security" <${emailUser.trim()}>`,
      to: toEmail,
      subject: `Your Password Reset OTP: ${otp} - TalentFlow EMS`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #4f46e5; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">TalentFlow EMS</h1>
            <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Employee Management System</p>
          </div>
          <div style="padding: 30px 24px; color: #1e293b;">
            <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">Password Reset Verification</h2>
            <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
              Hello <strong>${userName}</strong>,<br/>
              We received a request to reset the password for your account. Please use the following 6-digit One-Time Password (OTP) to complete the verification:
            </p>
            <div style="text-align: center; margin: 26px 0; background: #f8fafc; border: 1px dashed #6366f1; border-radius: 10px; padding: 18px;">
              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 6px;">Your 6-Digit OTP</span>
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: monospace;">${otp}</span>
              <span style="display: block; font-size: 12px; color: #e11d48; margin-top: 8px; font-weight: 500;">⏱️ Valid for 10 minutes only</span>
            </div>
            <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.6; color: #64748b;">
              If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #94a3b8;">
            © ${new Date().getFullYear()} TalentFlow EMS. All rights reserved.
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 [EMAIL SERVICE] OTP successfully delivered to ${toEmail} (MessageId: ${info.messageId})`);
    return {
      sent: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ [EMAIL SERVICE ERROR] Failed to send email via Gmail SMTP:', error.message);
    return {
      sent: false,
      error: error.message,
    };
  }
};

module.exports = { sendOtpEmail };
