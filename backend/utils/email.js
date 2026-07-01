const { Resend } = require('resend');

// Render blocks outbound SMTP ports entirely. Resend sends over HTTPS API.
// EMAIL_FROM: use a verified domain address, or leave blank to use Resend's
// shared default sender (onboarding@resend.dev) which works on free tier.
const RESEND_API_KEY = (process.env.RESEND_API_KEY || '').trim();
const EMAIL_FROM = (process.env.EMAIL_USER || '').trim() || 'onboarding@resend.dev';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const sendEmail = async ({ to, subject, html }) => {
  if (!resend) throw new Error('RESEND_API_KEY is not set');
  const { data, error } = await resend.emails.send({
    from: `CreatorHub <${EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
  if (error) throw Object.assign(new Error(error.message), { resendError: error });
  return { messageId: data?.id || null };
};

const verifyEmailConfig = async () => {
  if (!RESEND_API_KEY) {
    console.error('[email] RESEND_API_KEY is not set — emails will not send.');
    return false;
  }
  console.log(`[email] Resend configured (sending as ${EMAIL_FROM})`);
  return true;
};

const emailTemplates = {
  verifyEmail: (name, link) => `
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
        .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 13px; }
        .expire-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: #92400e; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ CreatorHub</h1>
          <p>The platform for creatives</p>
        </div>
        <div class="body">
          <h2>Welcome, ${name}! 🎉</h2>
          <p>Thanks for joining CreatorHub. To complete your registration and start connecting with amazing creators, please verify your email address.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${link}" class="btn" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;">Verify My Email</a>
          </div>
          <div class="expire-note">⏱ This link expires in <strong>24 hours</strong>.</div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break:break-all;background:#1f2937;padding:12px;border-radius:6px;font-size:12px;color:#a78bfa;">${link}</p>
        </div>
        <div class="footer">
          <p>© 2024 CreatorHub. All rights reserved.</p>
          <p>If the button doesn't work, copy and paste: <a href="${link}" style="color:#6366f1;">${link}</a></p>
        </div>
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
        <div class="header">
          <h1>🔐 CreatorHub</h1>
        </div>
        <div class="body">
          <h2>Reset Your Password</h2>
          <p>Hi ${name}, we received a request to reset your password. Click the button below to set a new password.</p>
          <div style="text-align: center;">
            <a href="${link}" class="btn">Reset Password</a>
          </div>
          <div class="expire-note">⏱ This link expires in <strong>1 hour</strong>.</div>
          <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>© 2024 CreatorHub. All rights reserved.</p>
        </div>
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
        .steps { background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .step { display: flex; align-items: flex-start; margin: 12px 0; color: #1f2937; }
        .step-num { background: #10b981; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
        .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌟 Welcome to CreatorHub!</h1>
        </div>
        <div class="body">
          <h2>You're now a Vendor, ${name}!</h2>
          <p>Your vendor account is live. Here's how to get started:</p>
          <div class="steps">
            <div class="step"><div class="step-num">1</div><div>Verify your email to activate your account</div></div>
            <div class="step"><div class="step-num">2</div><div>Upload a government-issued ID for verification</div></div>
            <div class="step"><div class="step-num">3</div><div>Complete your profile — bio, location, social links</div></div>
            <div class="step"><div class="step-num">4</div><div>Upload portfolio work and set your service packages</div></div>
          </div>
          <p>The more complete your profile, the higher you rank in search results. Good luck! 🚀</p>
        </div>
        <div class="footer">
          <p>© 2024 CreatorHub. All rights reserved.</p>
        </div>
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
        .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 13px; }
        .badge { background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: 600; display: inline-block; margin: 12px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ ID Verified!</h1>
        </div>
        <div class="body">
          <h2>Congratulations, ${name}!</h2>
          <div class="badge">🛡️ Identity Verified</div>
          <p>Great news — your government ID has been reviewed and approved. Your vendor profile is now fully verified and live on CreatorHub!</p>
          <p>You can now:</p>
          <ul style="color:#6b7280; line-height:2;">
            <li>✅ Access your full vendor dashboard</li>
            <li>✅ Upload portfolio images</li>
            <li>✅ Set your service packages & pricing</li>
            <li>✅ Appear in search results with a verified badge</li>
            <li>✅ Receive messages from clients</li>
          </ul>
          <div style="text-align:center;">
            <a href="${process.env.CLIENT_URL}/vendor/dashboard" class="btn">Go to My Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2024 CreatorHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

module.exports = { sendEmail, emailTemplates, verifyEmailConfig };
