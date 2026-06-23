/**
 * Authentication Middleware
 * 
 * Protects routes by verifying JWT tokens.
 * 
 * How it works:
 * 1. Checks for a Bearer token in the Authorization header
 * 2. Verifies the token using the JWT_SECRET
 * 3. Attaches the user object (minus password) to req.user
 * 4. If no token or invalid token, returns 401 Unauthorized
 * 
 * Usage: Add 'protect' as middleware to any route that needs authentication
 * Example: router.get('/profile', protect, getProfile);
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token and decode the payload (contains user id)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by id and attach to request (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Continue to the next middleware/route handler
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid',
      });
    }
  }

  // No token found in headers
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

module.exports = { protect };
