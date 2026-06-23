/**
 * Report Routes
 * 
 * POST /api/projects/:id/report - Generate an executive report
 * GET  /api/projects/:id/report - Get all reports for a project
 * 
 * Protected routes (require authentication)
 */

const express = require('express');
const router = express.Router();
const { createReport, getReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/:id/report')
  .post(createReport)
  .get(getReports);

module.exports = router;
