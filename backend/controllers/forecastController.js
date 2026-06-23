/**
 * Forecast Controller
 * 
 * Handles forecasting requests for project datasets.
 * Runs ML predictions via the forecasting service.
 */

const Dataset = require('../models/Dataset');
const Project = require('../models/Project');
const { runForecast } = require('../services/forecastingService');
const { detectAnomalies } = require('../services/anomalyService');

/**
 * GET /api/projects/:id/forecast
 * Generate forecasts for a project's dataset
 * 
 * Query params:
 *   - periods: Number of future periods to predict (default: 3)
 * 
 * Returns: Array of forecasts for each numeric metric
 */
const getForecast = async (req, res) => {
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

    // Get number of prediction periods from query param (default 3)
    const periods = parseInt(req.query.periods) || 3;

    // 1. Detect anomalies
    const anomalies = detectAnomalies(dataset.data, dataset.columnNames, dataset.columnTypes) || [];
    
    // 2. Create a clean copy of the data
    const cleanData = JSON.parse(JSON.stringify(dataset.data));

    // 3. Nullify high and medium severity outliers so they aren't forecasted
    anomalies.forEach(anomaly => {
      if (anomaly.severity === 'high' || anomaly.severity === 'medium') {
        cleanData[anomaly.rowIndex][anomaly.column] = null;
      }
    });

    // 4. Run forecasting on clean data (Python ML or JS fallback)
    const result = await runForecast(
      cleanData,
      dataset.columnNames,
      dataset.columnTypes,
      periods
    );

    res.json({
      success: true,
      data: {
        datasetInfo: {
          fileName: dataset.originalName,
          rows: dataset.rows,
        },
        periods,
        forecasts: result.forecasts || [],
      },
    });
  } catch (error) {
    console.error('Forecast error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating forecast',
    });
  }
};

module.exports = { getForecast };
