/**
 * Upload Routes
 * 
 * POST /api/projects/:id/upload   - Upload a dataset file
 * GET  /api/projects/:id/datasets - List all datasets for a project
 * 
 * All routes are protected (require authentication)
 */

const express = require('express');
const router = express.Router();
const { upload, uploadDataset, getDatasets } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// All upload routes require authentication
router.use(protect);

// Upload a file to a project (Multer handles the file)
router.post('/:id/upload', upload.single('file'), uploadDataset);

// List all datasets for a project
router.get('/:id/datasets', getDatasets);

module.exports = router;
