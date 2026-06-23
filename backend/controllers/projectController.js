/**
 * Project Controller
 * 
 * Handles CRUD operations for business analysis projects.
 * Each user can create multiple projects (Sales, Marketing, etc.)
 * 
 * All routes require authentication.
 * Users can only access their own projects.
 */

const Project = require('../models/Project');
const Dataset = require('../models/Dataset');
const Report = require('../models/Report');

/**
 * POST /api/projects
 * Create a new project
 * 
 * Body: { name, description }
 * Returns: The created project
 */
const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Project name is required',
      });
    }

    // Create project linked to the authenticated user
    const project = await Project.create({
      userId: req.user._id,
      name,
      description: description || '',
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Create project error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
    });
  }
};

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 * 
 * Returns: Array of projects sorted by creation date (newest first)
 */
const getProjects = async (req, res) => {
  try {
    // Find only projects belonging to the current user
    const projects = await Project.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Get projects error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
    });
  }
};

/**
 * GET /api/projects/:id
 * Get a single project by ID
 * 
 * Returns: The project with dataset count
 */
const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Count datasets for this project
    const datasetCount = await Dataset.countDocuments({ projectId: project._id });

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        datasetCount,
      },
    });
  } catch (error) {
    console.error('Get project error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
    });
  }
};

/**
 * DELETE /api/projects/:id
 * Delete a project and all its associated datasets and reports
 * 
 * This performs a cascade delete to clean up all related data.
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Cascade delete: remove all datasets and reports for this project
    await Dataset.deleteMany({ projectId: project._id });
    await Report.deleteMany({ projectId: project._id });

    // Delete the project itself
    await Project.deleteOne({ _id: project._id });

    res.json({
      success: true,
      message: 'Project and all associated data deleted',
    });
  } catch (error) {
    console.error('Delete project error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
    });
  }
};

module.exports = { createProject, getProjects, getProject, deleteProject };
