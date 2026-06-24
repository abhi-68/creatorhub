const express = require('express');
const router = express.Router();
const multer = require('multer');
const { upload, uploadToCloudinary } = require('../config/cloudinary');
const { protect, requireRole } = require('../middleware/auth');
const User = require('../models/User');

// @POST /api/upload/avatar
router.post('/avatar', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await uploadToCloudinary(req.file.buffer);
    await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url });
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// @POST /api/upload/portfolio
router.post('/portfolio', protect, requireRole('vendor'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await uploadToCloudinary(req.file.buffer);
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// @POST /api/upload/id
router.post('/id', protect, requireRole('vendor'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = await uploadToCloudinary(req.file.buffer, { folder: 'creatorhub/ids' });
    await User.findByIdAndUpdate(req.user._id, { 'vendorProfile.idDocument': result.secure_url });
    res.json({ url: result.secure_url, message: 'ID uploaded. Pending admin verification.' });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Handle multer errors (file too large, wrong type) with clear messages
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File must be under 10MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed (JPG, PNG, WEBP)' });
  }
  next(err);
});

module.exports = router;
