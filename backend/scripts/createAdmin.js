/**
 * Seed script: Creates an admin user in the database
 * Run once after deploying: node scripts/createAdmin.js
 *
 * Usage:
 *   MONGO_URI=your_uri node scripts/createAdmin.js
 *   OR set your .env and run: node -r dotenv/config scripts/createAdmin.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@creatorhub.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    process.exit(0);
  }
  const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
    isVerified: true,
  });
  console.log(`✅ Admin created: ${admin.email}`);
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
