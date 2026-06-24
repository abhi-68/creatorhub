const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// One review per user per vendor
reviewSchema.index({ vendor: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
