/**
 * Dataset Model
 * 
 * Stores metadata and parsed content of uploaded CSV/XLSX files.
 * The actual parsed data is stored as a JSON array in the 'data' field,
 * so we don't need to re-parse the file for analytics.
 * 
 * Fields:
 *   - projectId: Reference to the parent Project
 *   - userId: Reference to the User who uploaded this dataset
 *   - fileName: Stored filename on disk (in uploads/ folder)
 *   - originalName: Original filename as uploaded by the user
 *   - rows: Number of data rows in the dataset
 *   - columns: Number of columns in the dataset
 *   - columnNames: Array of column header names
 *   - columnTypes: Object mapping column names to detected data types
 *   - data: The parsed dataset as an array of row objects
 *   - uploadDate: When the file was uploaded
 */

const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  rows: {
    type: Number,
    default: 0,
  },
  columns: {
    type: Number,
    default: 0,
  },
  columnNames: {
    type: [String],
    default: [],
  },
  columnTypes: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  data: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Dataset', datasetSchema);
