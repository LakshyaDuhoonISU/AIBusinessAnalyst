/**
 * Project Model
 * 
 * Represents a business analysis project created by a user.
 * Each project can contain multiple datasets, reports, and AI insights.
 * 
 * Fields:
 *   - userId: Reference to the User who owns this project
 *   - name: Project name (e.g., "Sales Analysis Q4")
 *   - description: Brief description of the project's purpose
 *   - createdAt: Project creation timestamp
 */

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Project', projectSchema);
