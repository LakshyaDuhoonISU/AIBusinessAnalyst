/**
 * Report Controller
 * 
 * Handles executive report generation and retrieval.
 * Uses AI to generate report content, then creates a PDF.
 */

const Report = require('../models/Report');
const Dataset = require('../models/Dataset');
const Project = require('../models/Project');
const { detectKPIs } = require('../services/kpiService');
const { detectAnomalies } = require('../services/anomalyService');
const { generateReportContent } = require('../services/geminiService');
const { runForecast } = require('../services/forecastingService');
const { generatePDFReport } = require('../services/reportService');

/**
 * POST /api/projects/:id/report
 * Generate an executive report for the project
 */
const createReport = async (req, res) => {
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

    // Gather analytics data for the report
    const kpis = detectKPIs(dataset.data, dataset.columnNames, dataset.columnTypes);
    const anomalies = detectAnomalies(dataset.data, dataset.columnNames, dataset.columnTypes);

    // Run forecasting
    let forecasts = [];
    try {
      const forecastResult = await runForecast(
        dataset.data, dataset.columnNames, dataset.columnTypes, 3
      );
      forecasts = forecastResult.forecasts || [];
    } catch (err) {
      console.error('Forecast for report failed:', err.message);
    }

    // Generate report content using AI
    const reportContent = await generateReportContent(
      dataset.data,
      dataset.columnNames,
      dataset.columnTypes,
      kpis,
      anomalies,
      forecasts
    );

    // Generate PDF
    const pdfFileName = await generatePDFReport(
      reportContent,
      project.name,
      {
        fileName: dataset.originalName,
        rows: dataset.rows,
        columns: dataset.columns,
      },
      kpis
    );

    // Save report metadata to database
    const report = await Report.create({
      projectId: project._id,
      userId: req.user._id,
      reportContent,
      reportType: 'executive',
      filePath: pdfFileName,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: report._id,
        reportType: report.reportType,
        filePath: `/reports/${pdfFileName}`,
        reportContent: report.reportContent,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    console.error('Create report error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
    });
  }
};

/**
 * GET /api/projects/:id/report
 * Get all reports for a project
 */
const getReports = async (req, res) => {
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

    const reports = await Report.find({ projectId: project._id })
      .sort({ createdAt: -1 });

    // Add download URL to each report
    const reportsWithUrls = reports.map((report) => ({
      _id: report._id,
      reportType: report.reportType,
      reportContent: report.reportContent,
      filePath: report.filePath ? `/reports/${report.filePath}` : null,
      createdAt: report.createdAt,
    }));

    res.json({
      success: true,
      data: reportsWithUrls,
    });
  } catch (error) {
    console.error('Get reports error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
    });
  }
};

module.exports = { createReport, getReports };
