/**
 * Analytics Controller
 * 
 * Orchestrates all analytics services to generate comprehensive
 * data analysis results for a project's datasets.
 * 
 * Endpoints:
 *   GET /api/projects/:id/analytics - Full analytics (profile + trends + segments + anomalies)
 *   GET /api/projects/:id/kpis      - KPI detection only
 *   GET /api/projects/:id/segments  - Segment analysis only
 */

const Dataset = require('../models/Dataset');
const Project = require('../models/Project');
const { generateProfile } = require('../services/profilingService');
const { detectKPIs } = require('../services/kpiService');
const { generateTrends, generateSegments, calculateGrowthRates } = require('../services/analyticsService');
const { detectAnomalies } = require('../services/anomalyService');

/**
 * GET /api/projects/:id/analytics
 * Generate full analytics for a project's datasets
 * 
 * Returns: profile, KPIs, trends, segments, anomalies, growth rates
 */
const getAnalytics = async (req, res) => {
  try {
    // Verify project ownership
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

    // Get the most recent dataset for this project
    const dataset = await Dataset.findOne({ projectId: project._id })
      .sort({ uploadDate: -1 });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'No dataset found. Please upload a dataset first.',
      });
    }

    const { data, columnNames, columnTypes } = dataset;

    // Run all analytics services
    const profile = generateProfile(data, columnNames, columnTypes);
    const kpis = detectKPIs(data, columnNames, columnTypes);
    const trends = generateTrends(data, columnNames, columnTypes);
    const segments = generateSegments(data, columnNames, columnTypes);
    const anomalies = detectAnomalies(data, columnNames, columnTypes);

    // Calculate growth rates from trends
    const numericColumns = columnNames.filter((col) => columnTypes[col] === 'number');
    const growthRates = calculateGrowthRates(trends, numericColumns);

    res.json({
      success: true,
      data: {
        datasetInfo: {
          fileName: dataset.originalName,
          uploadDate: dataset.uploadDate,
        },
        profile,
        kpis,
        trends,
        segments,
        anomalies,
        growthRates,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating analytics',
    });
  }
};

/**
 * GET /api/projects/:id/kpis
 * Detect and return KPIs for a project's dataset
 */
const getKPIs = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const dataset = await Dataset.findOne({ projectId: project._id })
      .sort({ uploadDate: -1 });

    if (!dataset) {
      return res.status(404).json({ success: false, message: 'No dataset found' });
    }

    const kpis = detectKPIs(dataset.data, dataset.columnNames, dataset.columnTypes);

    res.json({ success: true, data: kpis });
  } catch (error) {
    console.error('KPI error:', error.message);
    res.status(500).json({ success: false, message: 'Error detecting KPIs' });
  }
};

/**
 * GET /api/projects/:id/segments
 * Generate segment analysis for a project's dataset
 */
const getSegments = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const dataset = await Dataset.findOne({ projectId: project._id })
      .sort({ uploadDate: -1 });

    if (!dataset) {
      return res.status(404).json({ success: false, message: 'No dataset found' });
    }

    const segments = generateSegments(dataset.data, dataset.columnNames, dataset.columnTypes);

    res.json({ success: true, data: segments });
  } catch (error) {
    console.error('Segments error:', error.message);
    res.status(500).json({ success: false, message: 'Error generating segments' });
  }
};

module.exports = { getAnalytics, getKPIs, getSegments };
