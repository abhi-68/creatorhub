const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

// @GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user.toSafeObject());
});

// @PUT /api/users/profile
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

// @DELETE /api/users/account
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
