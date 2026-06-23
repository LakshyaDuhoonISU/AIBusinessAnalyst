/**
 * Analytics Routes
 * 
 * GET /api/projects/:id/analytics - Full analytics dashboard data
 * GET /api/projects/:id/kpis      - KPI detection
 * GET /api/projects/:id/segments  - Segment analysis
 * 
 * All routes are protected (require authentication)
 */

const express = require('express');
const router = express.Router();
const { getAnalytics, getKPIs, getSegments } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:id/analytics', getAnalytics);
router.get('/:id/kpis', getKPIs);
router.get('/:id/segments', getSegments);

module.exports = router;
