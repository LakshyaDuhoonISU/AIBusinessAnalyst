/**
 * AI Controller
 * 
 * Handles AI-powered features:
 *   - Ask business questions about datasets
 *   - Auto-generate insights
 */

const Dataset = require('../models/Dataset');
const Project = require('../models/Project');
const { detectKPIs } = require('../services/kpiService');
const { detectAnomalies } = require('../services/anomalyService');
const { askQuestion, generateInsights } = require('../services/geminiService');

/**
 * POST /api/projects/:id/ask
 * Ask a business question about the project's dataset
 * 
 * Body: { question: "Why did sales decrease?" }
 * Returns: AI-generated analysis
 */
const askAnalyst = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a question',
      });
    }

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

    const dataset = await Dataset.findOne({ projectId: project._id })
      .sort({ uploadDate: -1 });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'No dataset found. Please upload a dataset first.',
      });
    }

    // Detect KPIs for context
    const kpis = detectKPIs(dataset.data, dataset.columnNames, dataset.columnTypes);

    // Ask the AI
    const answer = await askQuestion(
      question,
      dataset.data,
      dataset.columnNames,
      dataset.columnTypes,
      kpis
    );

    res.json({
      success: true,
      data: {
        question,
        answer,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Ask analyst error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing question',
    });
  }
};

/**
 * POST /api/projects/:id/generate-insights
 * Auto-generate business insights for the project's dataset
 * 
 * Returns: AI-generated findings, risks, and opportunities
 */
const autoGenerateInsights = async (req, res) => {
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

    const dataset = await Dataset.findOne({ projectId: project._id })
      .sort({ uploadDate: -1 });

    if (!dataset) {
      return res.status(404).json({
        success: false,
        message: 'No dataset found. Please upload a dataset first.',
      });
    }

    // Get KPIs and anomalies for AI context
    const kpis = detectKPIs(dataset.data, dataset.columnNames, dataset.columnTypes);
    const anomalies = detectAnomalies(dataset.data, dataset.columnNames, dataset.columnTypes);

    // Generate insights
    const insights = await generateInsights(
      dataset.data,
      dataset.columnNames,
      dataset.columnTypes,
      kpis,
      anomalies
    );

    res.json({
      success: true,
      data: {
        insights,
        kpis,
        anomalyCount: anomalies.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Generate insights error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating insights',
    });
  }
};

module.exports = { askAnalyst, autoGenerateInsights };
