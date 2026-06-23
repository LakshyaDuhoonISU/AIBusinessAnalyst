/**
 * Forecast Routes
 * 
 * GET /api/projects/:id/forecast - Generate forecasts
 * 
 * Protected route (requires authentication)
 */

const express = require('express');
const router = express.Router();
const { getForecast } = require('../controllers/forecastController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:id/forecast', getForecast);

module.exports = router;
