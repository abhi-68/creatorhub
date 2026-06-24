const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, requireRole, requireVerified, requireIdVerified } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// @GET /api/vendors — public list with filters
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12, sort = 'rating' } = req.query;
    const filter = { role: 'vendor', isActive: true, isVerified: true, 'vendorProfile.idVerified': true };

    if (category) filter['vendorProfile.category'] = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'vendorProfile.bio': { $regex: search, $options: 'i' } },
        { 'vendorProfile.location': { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = {
      rating: { 'vendorProfile.rating': -1 },
      newest: { createdAt: -1 },
      reviews: { 'vendorProfile.totalReviews': -1 },
    };

    const vendors = await User.find(filter)
      .select('-password -verificationToken -resetPasswordToken -vendorProfile.idDocument')
      .sort(sortMap[sort] || sortMap.rating)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    res.json({ vendors, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/vendors/featured
router.get('/featured', async (req, res) => {
  try {
    const vendors = await User.find({
      role: 'vendor',
      isActive: true,
      isVerified: true,
      'vendorProfile.idVerified': true,
      'vendorProfile.featured': true,
    })
      .select('-password -verificationToken -resetPasswordToken -vendorProfile.idDocument')
      .sort({ 'vendorProfile.rating': -1 })
      .limit(8);
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ⚠️  FIX: /profile and /portfolio must come BEFORE /:id or Express will treat
//     "profile" as a vendorId and return 404 on those routes.

// @PUT /api/vendors/profile — update own vendor profile
router.put(
  '/profile',
  protect,
  requireRole('vendor'),
  requireVerified,
  requireIdVerified,
  [
    body('bio').optional().isLength({ max: 1000 }).withMessage('Bio must be under 1000 characters'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('packages').optional().isArray().withMessage('Packages must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const allowedFields = ['bio', 'location', 'instagram', 'youtube', 'tiktok', 'website', 'phone', 'packages', 'availability', 'category'];
      const update = {};
      allowedFields.forEach((f) => {
        if (req.body[f] !== undefined) update[`vendorProfile.${f}`] = req.body[f];
      });
      if (req.body.name) update.name = req.body.name;
      if (req.body.avatar) update.avatar = req.body.avatar;

      const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select('-password -vendorProfile.idDocument');
      res.json(user.toSafeObject());
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// @POST /api/vendors/portfolio — add portfolio item
router.post('/portfolio', protect, requireRole('vendor'), requireVerified, requireIdVerified, async (req, res) => {
  try {
    const { image, caption } = req.body;
    if (!image) return res.status(400).json({ error: 'Image URL required' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { 'vendorProfile.portfolio': { image, caption } } },
      { new: true }
    ).select('-password -vendorProfile.idDocument');
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @DELETE /api/vendors/portfolio/:itemId
router.delete('/portfolio/:itemId', protect, requireRole('vendor'), requireIdVerified, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { 'vendorProfile.portfolio': { _id: req.params.itemId } } },
      { new: true }
    ).select('-password -vendorProfile.idDocument');
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/vendors/:id — public vendor profile  (must stay AFTER named routes)
router.get('/:id', async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendor', isActive: true })
      .select('-password -verificationToken -resetPasswordToken -vendorProfile.idDocument');
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/vendors/:id/reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ vendor: req.params.id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
