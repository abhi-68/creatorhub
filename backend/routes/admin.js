const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Review = require('../models/Review');
const Message = require('../models/Message');
const { protect, requireRole } = require('../middleware/auth');
const { sendEmail, emailTemplates, verifyEmailConfig } = require('../utils/email');

// @GET /api/admin/users
router.get('/users', protect, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const users = await User.find(filter)
      .select('-password -verificationToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/admin/stats — includes pending ID verifications
router.get('/stats', protect, requireRole('admin'), async (req, res) => {
  try {
    const [totalUsers, totalVendors, verifiedVendors, totalReviews, pendingIdVerifications] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ role: 'vendor', isVerified: true, 'vendorProfile.idVerified': true }),
      Review.countDocuments(),
      // Vendors who uploaded ID but haven't been verified yet
      User.countDocuments({
        role: 'vendor',
        'vendorProfile.idDocument': { $exists: true, $ne: '' },
        'vendorProfile.idVerified': false,
      }),
    ]);
    res.json({ totalUsers, totalVendors, verifiedVendors, totalReviews, pendingIdVerifications });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/admin/email-status — diagnose SMTP config without digging through server logs
router.get('/email-status', protect, requireRole('admin'), async (req, res) => {
  const ok = await verifyEmailConfig();
  res.json({
    ok,
    emailUserSet: !!process.env.EMAIL_USER,
    emailPassSet: !!process.env.EMAIL_PASS,
    message: ok
      ? 'SMTP connection verified — credentials are valid.'
      : 'SMTP verification failed — check server logs for the exact error, and confirm EMAIL_USER/EMAIL_PASS are set correctly (EMAIL_PASS must be a Gmail App Password).',
  });
});

// @POST /api/admin/email-test — send a real test email to confirm end-to-end delivery
router.post('/email-test', protect, requireRole('admin'), async (req, res) => {
  const to = req.body?.to || req.user.email;
  try {
    const info = await sendEmail({
      to,
      subject: 'CreatorHub test email',
      html: `<p>This is a test email sent at ${new Date().toISOString()}. If you received this, SMTP is working.</p>`,
    });
    res.json({ ok: true, messageId: info.messageId, sentTo: to });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, code: err.code });
  }
});

// @GET /api/admin/vendors/pending-id — get vendors with pending ID verification
router.get('/vendors/pending-id', protect, requireRole('admin'), async (req, res) => {
  try {
    const vendors = await User.find({
      role: 'vendor',
      'vendorProfile.idDocument': { $exists: true, $ne: '' },
      'vendorProfile.idVerified': false,
    })
      .select('name email avatar createdAt vendorProfile.idDocument vendorProfile.category')
      .sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @DELETE /api/admin/users/:id
router.delete('/users/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin accounts' });
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Message.deleteMany({ $or: [{ sender: req.params.id }, { receiver: req.params.id }] }),
      Review.deleteMany({ $or: [{ reviewer: req.params.id }, { vendor: req.params.id }] }),
    ]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @PUT /api/admin/users/:id/verify-email
router.put('/users/:id/verify-email', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isVerified: true },
        $unset: { verificationToken: '', verificationTokenExpires: '' },
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Email verified' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @PUT /api/admin/users/:id/toggle-active
router.put('/users/:id/toggle-active', protect, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot deactivate admins' });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @PUT /api/admin/vendors/:id/feature
router.put('/vendors/:id/feature', protect, requireRole('admin'), async (req, res) => {
  try {
    const vendor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'vendor' },
      { $set: { 'vendorProfile.featured': req.body.featured } },
      { new: true }
    );
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Updated', featured: vendor.vendorProfile.featured });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @PUT /api/admin/vendors/:id/verify-id
router.put('/vendors/:id/verify-id', protect, requireRole('admin'), async (req, res) => {
  try {
    const vendor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'vendor' },
      { $set: { 'vendorProfile.idVerified': true } },
      { new: true }
    );
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    res.json({ message: 'ID verified' });

    setImmediate(async () => {
      try {
        await sendEmail({
          to: vendor.email,
          subject: '✅ Your ID has been verified on CreatorHub!',
          html: emailTemplates.idApproved(vendor.name),
        });
      } catch (e) {
        console.warn('ID approval email failed:', e.message);
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @PUT /api/admin/vendors/:id/reject-id — reject with reason
router.put('/vendors/:id/reject-id', protect, requireRole('admin'), async (req, res) => {
  try {
    const vendor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'vendor' },
      { $unset: { 'vendorProfile.idDocument': '' } },
      { new: true }
    );
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    res.json({ message: 'ID rejected and cleared' });

    setImmediate(async () => {
      try {
        await sendEmail({
          to: vendor.email,
          subject: '❌ ID verification issue on CreatorHub',
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px;">
              <h2>Hi ${vendor.name},</h2>
              <p>Unfortunately we were unable to verify your ID document. This may be because:</p>
              <ul>
                <li>The image was blurry or partially cut off</li>
                <li>The document type is not accepted</li>
                <li>The name doesn't match your account</li>
              </ul>
              <p>Please re-upload a clear photo of a valid government-issued ID from your vendor dashboard.</p>
              <p>Reason from admin: <strong>${req.body.reason || 'Please re-upload a clearer image.'}</strong></p>
              <a href="${process.env.CLIENT_URL}/vendor/id-upload" style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Re-upload ID</a>
            </div>
          `,
        });
      } catch (e) {
        console.warn('ID rejection email failed:', e.message);
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Recalculate vendor rating after deletion
    const allReviews = await Review.find({ vendor: review.vendor });
    const avgRating = allReviews.length
      ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length
      : 0;
    await User.findByIdAndUpdate(review.vendor, {
      'vendorProfile.rating': Math.round(avgRating * 10) / 10,
      'vendorProfile.totalReviews': allReviews.length,
    });

    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
