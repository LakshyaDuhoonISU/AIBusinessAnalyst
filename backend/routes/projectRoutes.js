/**
 * Project Routes
 * 
 * POST   /api/projects     - Create a new project
 * GET    /api/projects      - List all user's projects
 * GET    /api/projects/:id  - Get a single project
 * DELETE /api/projects/:id  - Delete a project
 * 
 * All routes are protected (require authentication)
 */

const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// All project routes require authentication
router.use(protect);

router.route('/')
  .post(createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProject)
  .delete(deleteProject);

module.exports = router;
