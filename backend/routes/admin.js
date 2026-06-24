const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, requireRole } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

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

// @GET /api/admin/stats
router.get('/stats', protect, requireRole('admin'), async (req, res) => {
  try {
    const [totalUsers, totalVendors, verifiedVendors, totalReviews] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ role: 'vendor', isVerified: true }),
      Review.countDocuments(),
    ]);
    res.json({ totalUsers, totalVendors, verifiedVendors, totalReviews });
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
    const Message = require('../models/Message');
    const Review = require('../models/Review');
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
      { $set: { isVerified: true, verificationToken: undefined, verificationTokenExpires: undefined } },
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

    // Send approval email
    try {
      await sendEmail({
        to: vendor.email,
        subject: '✅ Your ID has been verified on CreatorHub!',
        html: emailTemplates.idApproved(vendor.name),
      });
    } catch (e) {
      console.warn('ID approval email failed:', e.message);
    }

    res.json({ message: 'ID verified' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
