const { google } = require('googleapis');

const getGmailClient = () => {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth });
};

const buildRawMessage = ({ from, to, subject, html }) => {
  const msg = [
    `From: CreatorHub <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');
  return Buffer.from(msg).toString('base64url');
};

const sendEmail = async ({ to, subject, html }) => {
  const from = process.env.EMAIL_USER;
  const gmail = getGmailClient();
  const raw = buildRawMessage({ from, to, subject, html });
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });
  return { messageId: result.data.id };
};

const verifyEmailConfig = async () => {
  const missing = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'EMAIL_USER']
    .filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('[email] Missing env vars:', missing.join(', '));
    return false;
  }
  console.log(`[email] Gmail API configured (sending as ${process.env.EMAIL_USER})`);
  return true;
};

const emailTemplates = {
  verifyCode: (name, code) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; }
        .body { padding: 40px; }
        .body h2 { color: #1f2937; margin-top: 0; }
        .body p { color: #6b7280; line-height: 1.6; }
        .code-box { background: #1f2937; border-radius: 12px; padding: 28px 20px; text-align: center; margin: 28px 0; }
        .code { font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #a78bfa; font-family: monospace; }
        .expire-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: #92400e; font-size: 14px; }
        .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ CreatorHub</h1>
          <p>Email Verification</p>
        </div>
        <div class="body">
          <h2>Hi ${name}! 👋</h2>
          <p>Use the code below to verify your email address. Enter it on the verification page to activate your account.</p>
          <div class="code-box">
            <div class="code">${code}</div>
            <p style="color:#9ca3af;font-size:13px;margin:8px 0 0;">Your verification code</p>
          </div>
          <div class="expire-note">⏱ This code expires in <strong>15 minutes</strong>.</div>
          <p>If you didn't create a CreatorHub account, you can safely ignore this email.</p>
        </div>
        <div class="footer"><p>© 2024 CreatorHub. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `,

  resetPassword: (name, link) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444, #f97316); padding: 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; }
        .body { padding: 40px; }
        .body h2 { color: #1f2937; margin-top: 0; }
        .body p { color: #6b7280; line-height: 1.6; }
        .btn { display: inline-block; background: linear-gradient(135deg, #ef4444, #f97316); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 13px; }
        .expire-note { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: #991b1b; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🔐 CreatorHub</h1></div>
        <div class="body">
          <h2>Reset Your Password</h2>
          <p>Hi ${name}, we received a request to reset your password. Click the button below to set a new password.</p>
          <div style="text-align: center;">
            <a href="${link}" class="btn">Reset Password</a>
          </div>
          <div class="expire-note">⏱ This link expires in <strong>1 hour</strong>.</div>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer"><p>© 2024 CreatorHub. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `,

  welcomeVendor: (name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; }
        .body { padding: 40px; }
        .body h2 { color: #1f2937; margin-top: 0; }
        .body p { color: #6b7280; line-height: 1.6; }
        .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🌟 Welcome to CreatorHub!</h1></div>
        <div class="body">
          <h2>You're now a Vendor, ${name}!</h2>
          <p>Your vendor account is live. Complete your profile, upload portfolio work, and set your packages to start getting hired.</p>
        </div>
        <div class="footer"><p>© 2024 CreatorHub. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `,

  idApproved: (name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; }
        .body { padding: 40px; }
        .body h2 { color: #1f2937; margin-top: 0; }
        .body p { color: #6b7280; line-height: 1.6; }
        .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>✅ ID Verified!</h1></div>
        <div class="body">
          <h2>Congratulations, ${name}!</h2>
          <p>Your government ID has been reviewed and approved. Your vendor profile is now fully verified on CreatorHub!</p>
        </div>
        <div class="footer"><p>© 2024 CreatorHub. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `,
};

module.exports = { sendEmail, emailTemplates, verifyEmailConfig };
