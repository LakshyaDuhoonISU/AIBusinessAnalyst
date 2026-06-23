/**
 * Report Model
 * 
 * Stores metadata for generated executive reports.
 * The actual PDF file is stored on disk in the reports/ folder.
 * 
 * Fields:
 *   - projectId: Reference to the parent Project
 *   - userId: Reference to the User who generated this report
 *   - reportContent: The text content of the report (for preview)
 *   - reportType: Type of report (e.g., 'executive', 'analytics')
 *   - filePath: Path to the generated PDF file on disk
 *   - createdAt: Report generation timestamp
 */

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
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
  reportContent: {
    type: String,
    default: '',
  },
  reportType: {
    type: String,
    enum: ['executive', 'analytics', 'forecast'],
    default: 'executive',
  },
  filePath: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Report', reportSchema);
