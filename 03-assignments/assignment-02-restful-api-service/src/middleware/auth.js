const mongoose = require('mongoose');
const User = require('../models/User');
const { HttpError } = require('./errorHandler');

// Simple identification for the assignment: the client sends its user id in the
// "X-User-Id" header. (A production app would use login + JWT instead.)
async function identify(req, res, next) {
  try {
    const id = req.get('X-User-Id');
    if (!id || !mongoose.isValidObjectId(id)) throw new HttpError(401, 'Send a valid X-User-Id header');
    const user = await User.findById(id);
    if (!user) throw new HttpError(401, 'Unknown user');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new HttpError(403, `Only ${roles.join(' or ')} can do this`));
  next();
};

module.exports = { identify, allow };
