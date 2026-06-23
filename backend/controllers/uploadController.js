/**
 * Upload Controller
 * 
 * Handles file uploads for datasets (CSV and XLSX formats).
 * 
 * When a file is uploaded:
 * 1. Multer saves the file to the uploads/ directory
 * 2. The file is parsed (CSV or XLSX) into a JSON array
 * 3. Column names, types, and row count are extracted
 * 4. All metadata + parsed data are stored in MongoDB
 * 
 * This way, analytics can work directly from the database
 * without needing to re-read the file from disk.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const Dataset = require('../models/Dataset');
const Project = require('../models/Project');

// --- Multer Configuration ---
// Configure where uploaded files are stored and how they're named
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Only allow CSV and XLSX files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and XLSX files are supported'), false);
  }
};

// Multer upload middleware (single file, max 50MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

/**
 * Helper: Parse a CSV file and return array of row objects
 * Uses csv-parser to stream the file
 */
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Helper: Parse an XLSX file and return array of row objects
 * Uses the xlsx library to read the first sheet
 */
const parseXLSX = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  // Get the first sheet name
  const sheetName = workbook.SheetNames[0];
  // Convert sheet to JSON array
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return data;
};

/**
 * Helper: Detect the data type of a column based on its values
 * Returns: 'number', 'date', or 'string'
 */
const detectColumnType = (values) => {
  // Filter out empty/null values
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (nonEmpty.length === 0) return 'string';

  // Check if most values are numbers
  const numericCount = nonEmpty.filter((v) => !isNaN(Number(v))).length;
  if (numericCount / nonEmpty.length > 0.8) return 'number';

  // Check if most values are dates
  const dateCount = nonEmpty.filter((v) => !isNaN(Date.parse(v))).length;
  if (dateCount / nonEmpty.length > 0.8) return 'date';

  return 'string';
};

/**
 * POST /api/projects/:id/upload
 * Upload a dataset file to a project
 * 
 * The file is parsed and stored in MongoDB along with metadata.
 */
const uploadDataset = async (req, res) => {
  try {
    // Verify the project exists and belongs to the user
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

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Parse the file based on its extension
    let data;
    if (ext === '.csv') {
      data = await parseCSV(filePath);
    } else {
      data = parseXLSX(filePath);
    }

    // Extract column names from the first row
    const columnNames = data.length > 0 ? Object.keys(data[0]) : [];

    // Detect data types for each column
    const columnTypes = {};
    columnNames.forEach((col) => {
      const values = data.map((row) => row[col]);
      columnTypes[col] = detectColumnType(values);
    });

    // Convert numeric string values to actual numbers for analytics
    const cleanedData = data.map((row) => {
      const cleanRow = {};
      columnNames.forEach((col) => {
        if (columnTypes[col] === 'number' && row[col] !== '' && row[col] !== null) {
          cleanRow[col] = Number(row[col]);
        } else {
          cleanRow[col] = row[col];
        }
      });
      return cleanRow;
    });

    // Save dataset metadata and parsed data to MongoDB
    const dataset = await Dataset.create({
      projectId: project._id,
      userId: req.user._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      rows: cleanedData.length,
      columns: columnNames.length,
      columnNames,
      columnTypes,
      data: cleanedData,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: dataset._id,
        fileName: dataset.originalName,
        rows: dataset.rows,
        columns: dataset.columns,
        columnNames: dataset.columnNames,
        columnTypes: dataset.columnTypes,
        uploadDate: dataset.uploadDate,
      },
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error uploading dataset: ' + error.message,
    });
  }
};

/**
 * GET /api/projects/:id/datasets
 * Get all datasets for a project
 * 
 * Returns metadata only (not the full data array) for listing
 */
const getDatasets = async (req, res) => {
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

    // Return datasets without the large 'data' field for listing
    const datasets = await Dataset.find({ projectId: project._id })
      .select('-data')
      .sort({ uploadDate: -1 });

    res.json({
      success: true,
      data: datasets,
    });
  } catch (error) {
    console.error('Get datasets error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching datasets',
    });
  }
};

module.exports = { upload, uploadDataset, getDatasets };
