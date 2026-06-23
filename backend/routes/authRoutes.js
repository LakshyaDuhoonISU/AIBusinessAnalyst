/**
 * Authentication Routes
 * 
 * POST /api/auth/register - Create new user account
 * POST /api/auth/login    - Login with email/password
 * GET  /api/auth/me       - Get current user profile (protected)
 */

const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (no authentication needed)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected route (requires JWT token)
router.get('/me', protect, getMe);

module.exports = router;
