const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Todo = require('../models/Todo');
const Activity = require('../models/Activity');
const PushSubscription = require('../models/PushSubscription');
const { sendPasswordResetEmail } = require('../services/emailService');

const USERNAME_RE = /^[a-z0-9_]+$/;

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, and password',
      });
    }

    // Validate username
    const cleanUsername = username ? username.toLowerCase().trim() : '';
    if (!cleanUsername) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    if (!USERNAME_RE.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: 'Username can only contain lowercase letters, numbers, and underscores' });
    }
    if (cleanUsername.length > 8) {
      return res.status(400).json({ success: false, message: 'Username cannot exceed 8 characters' });
    }
    const usernameTaken = await User.findOne({ username: cleanUsername });
    if (usernameTaken) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      username: cleanUsername,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data provided',
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Accept either `identifier` (email or username) or legacy `email` field
    const identifier = (req.body.identifier || req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email/username and password',
      });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username || null,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching user profile',
    });
  }
};

// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Please provide your email address' });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const appUrl = process.env.APP_URL || 'https://todo-app-7ddz.onrender.com';
    const resetUrl = `${appUrl}/?reset=${resetToken}`;

    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });

    res.json({ success: true, message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reset email. Try again.' });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password.' });
  }
};

// @desc    Check if a username is available
// @route   POST /api/auth/check-username
// @access  Public
const checkUsername = async (req, res) => {
  try {
    const raw = (req.body.username || '').toLowerCase().trim();
    if (!raw) return res.json({ available: false, message: 'Username is required' });
    if (!USERNAME_RE.test(raw)) return res.json({ available: false, message: 'Only a-z, 0-9, and _ allowed' });
    if (raw.length > 8) return res.json({ available: false, message: 'Max 8 characters' });
    const exists = await User.findOne({ username: raw });
    res.json({ available: !exists, message: exists ? 'Username is taken' : 'Available!' });
  } catch (error) {
    res.status(500).json({ available: false, message: 'Server error' });
  }
};

// @desc    Set or update username for the logged-in user
// @route   PATCH /api/auth/set-username
// @access  Private
const setUsername = async (req, res) => {
  try {
    const raw = (req.body.username || '').toLowerCase().trim();
    if (!raw || !USERNAME_RE.test(raw) || raw.length > 8) {
      return res.status(400).json({ success: false, message: 'Invalid username format' });
    }
    const conflict = await User.findOne({ username: raw, _id: { $ne: req.user._id } });
    if (conflict) return res.status(400).json({ success: false, message: 'Username is already taken' });

    req.user.username = raw;
    await req.user.save({ validateBeforeSave: false });
    res.json({ success: true, data: { username: req.user.username } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Permanently delete account and all associated data
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    await Promise.all([
      Todo.deleteMany({ user: userId }),
      Activity.deleteMany({ user: userId }),
      PushSubscription.deleteMany({ user: userId }),
      User.deleteOne({ _id: userId }),
    ]);
    res.json({ success: true, message: 'Account permanently deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  checkUsername,
  setUsername,
  deleteAccount,
};
