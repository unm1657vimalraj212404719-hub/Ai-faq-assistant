const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const userPayload = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    // role is never accepted from the client; admins are promoted directly in the DB
    const user = await User.create({ name, email, password });
    res.status(201).json({ success: true, token: signToken(user._id), user: userPayload(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }
    res.json({ success: true, token: signToken(user._id), user: userPayload(user) });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = (req, res) => {
  res.json({ success: true, user: userPayload(req.user) });
};
