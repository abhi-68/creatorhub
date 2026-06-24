const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

// @GET /api/users/profile — own profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user.toSafeObject());
});

// @PUT /api/users/profile — update own basic profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const update = {};
    if (name) update.name = name;
    if (avatar) update.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/users/:id — get any user's public profile (for chat participant lookup)
// ⚠️ FIX: Chat.jsx was falling back to /users/profile (own profile) when the
//    target user wasn't a vendor. This endpoint provides proper user lookup by ID.
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar role vendorProfile.category');
    if (!user || !user.isActive) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @DELETE /api/users/account — self-delete
router.delete('/account', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be self-deleted' });
    }
    await Promise.all([
      User.findByIdAndDelete(req.user._id),
      Message.deleteMany({ $or: [{ sender: req.user._id }, { receiver: req.user._id }] }),
      Review.deleteMany({ $or: [{ reviewer: req.user._id }, { vendor: req.user._id }] }),
    ]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
