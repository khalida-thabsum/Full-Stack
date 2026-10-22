const User = require('../models/User');

exports.register = async (req, res, next) => {
  try {
    const { name, role, email, roomNo, skill } = req.body;
    const user = await User.create({ name, role, email, roomNo, skill });
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.skill) filter.skill = req.query.skill;
    res.json({ data: await User.find(filter).sort('name') });
  } catch (err) {
    next(err);
  }
};

exports.me = (req, res) => res.json({ data: req.user });
