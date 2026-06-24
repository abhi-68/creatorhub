const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @POST /api/reviews/:vendorId
router.post(
  '/:vendorId',
  protect,
  requireRole('user'),
  [
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const vendor = await User.findOne({ _id: req.params.vendorId, role: 'vendor' });
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

      const existing = await Review.findOne({ vendor: req.params.vendorId, reviewer: req.user._id });
      if (existing) return res.status(400).json({ error: 'You already reviewed this vendor' });

      const review = await Review.create({
        vendor: req.params.vendorId,
        reviewer: req.user._id,
        rating: req.body.rating,
        comment: req.body.comment,
      });

      // Recalculate vendor rating
      const allReviews = await Review.find({ vendor: req.params.vendorId });
      const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
      await User.findByIdAndUpdate(req.params.vendorId, {
        'vendorProfile.rating': Math.round(avgRating * 10) / 10,
        'vendorProfile.totalReviews': allReviews.length,
      });

      await review.populate('reviewer', 'name avatar');
      res.status(201).json(review);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
