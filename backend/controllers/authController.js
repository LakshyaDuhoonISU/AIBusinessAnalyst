/**
 * Authentication Controller
 * 
 * Handles user registration, login, and profile retrieval.
 * 
 * Functions:
 *   - registerUser: Create new account and return JWT
 *   - loginUser: Verify credentials and return JWT
 *   - getMe: Return current user's profile (requires auth)
 * 
 * JWT tokens are generated with the user's ID and expire in 30 days.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Helper: Generate a JWT token for a user
 * The token contains the user's ID and expires in 30 days
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Body: { name, email, password }
 * Returns: { user info, token }
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create the new user (password is hashed by the pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate JWT token and return user info
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

/**
 * POST /api/auth/login
 * Login with email and password
 * 
 * Body: { email, password }
 * Returns: { user info, token }
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email (include password field for comparison)
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token and return user info
    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

/**
 * GET /api/auth/me
 * Get the current logged-in user's profile
 * Requires: Authentication (JWT token)
 * 
 * Returns: { user info }
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    res.json({
      success: true,
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile',
    });
  }
};

module.exports = { registerUser, loginUser, getMe };
