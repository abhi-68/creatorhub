const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ error: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token invalid or expired' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ error: 'Please verify your email first' });
  }
  next();
};

// Vendors must have ID verified before accessing protected vendor features
const requireIdVerified = (req, res, next) => {
  if (req.user.role === 'vendor' && !req.user.vendorProfile?.idVerified) {
    if (!req.user.vendorProfile?.idDocument) {
      return res.status(403).json({ error: 'ID_REQUIRED', message: 'Please upload a government ID to access this feature' });
    }
    return res.status(403).json({ error: 'ID_PENDING', message: 'Your ID is pending admin verification' });
  }
  next();
};

module.exports = { protect, requireRole, requireVerified, requireIdVerified };
