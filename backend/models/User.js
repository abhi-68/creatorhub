const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'vendor', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    isActive: { type: Boolean, default: true },

    // Vendor-specific fields
    vendorProfile: {
      category: {
        type: String,
        enum: ['photographer', 'influencer', 'videographer', 'graphic_designer', 'content_creator', 'model', 'makeup_artist', 'other'],
      },
      bio: { type: String, maxlength: 1000 },
      location: { type: String },
      instagram: { type: String },
      youtube: { type: String },
      tiktok: { type: String },
      website: { type: String },
      phone: { type: String },
      idDocument: { type: String }, // Cloudinary URL
      idVerified: { type: Boolean, default: false },
      portfolio: [
        {
          image: { type: String },
          caption: { type: String },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      packages: [
        {
          name: { type: String, required: true },
          description: { type: String },
          price: { type: Number, required: true },
          currency: { type: String, default: 'USD' },
          deliveryDays: { type: Number },
        },
      ],
      rating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      featured: { type: Boolean, default: false },
      availability: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Don't return password or sensitive tokens
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationTokenExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
