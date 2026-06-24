const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../utils/email');
const { protect } = require('../middleware/auth');

// @POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'vendor']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role = 'user' } = req.body;
    try {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ error: 'Email already registered' });

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const user = await User.create({
        name,
        email,
        password,
        role,
        verificationToken,
        verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
      });

      const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
      try {
        await sendEmail({ to: email, subject: 'Verify your CreatorHub account', html: emailTemplates.verifyEmail(name, verifyLink) });
        if (role === 'vendor') {
          await sendEmail({ to: email, subject: 'Welcome to CreatorHub as a Vendor!', html: emailTemplates.welcomeVendor(name) });
        }
      } catch (emailErr) {
        console.warn('Email sending failed (check EMAIL_USER/EMAIL_PASS in .env):', emailErr.message);
        // Registration still succeeds — user can be manually verified via admin
      }

      res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// @POST /api/auth/resend-verification
router.post('/resend-verification', [body('email').isEmail().normalizeEmail()], async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ message: 'If that email exists, a verification link was sent.' });
    if (user.isVerified) return res.status(400).json({ error: 'Email is already verified' });

    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    try {
      await sendEmail({ to: user.email, subject: 'Verify your CreatorHub account', html: emailTemplates.verifyEmail(user.name, verifyLink) });
    } catch (e) {
      console.warn('Email failed:', e.message);
    }
    res.json({ message: 'Verification email sent! Check your inbox.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/auth/verify-email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      if (!user.isActive) return res.status(403).json({ error: 'Account has been deactivated' });

      res.json({
        token: generateToken(user._id),
        user: user.toSafeObject(),
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// @POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    try {
      await sendEmail({ to: user.email, subject: 'Reset your CreatorHub password', html: emailTemplates.resetPassword(user.name, resetLink) });
    } catch (emailErr) {
      console.warn('Email sending failed:', emailErr.message);
    }

    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const user = await User.findOne({
        resetPasswordToken: req.body.token,
        resetPasswordExpires: { $gt: Date.now() },
      });
      if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// @GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.user.toSafeObject());
});

module.exports = router;
