/**
 * AI Routes
 * 
 * POST /api/projects/:id/ask              - Ask a business question
 * POST /api/projects/:id/generate-insights - Auto-generate insights
 * 
 * Protected routes (require authentication)
 */

const express = require('express');
const router = express.Router();
const { askAnalyst, autoGenerateInsights } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/:id/ask', askAnalyst);
router.post('/:id/generate-insights', autoGenerateInsights);

module.exports = router;
