/**
 * AI Business Analyst - Backend Server
 * 
 * Main entry point for the Express.js backend.
 * Sets up middleware, connects to MongoDB, and registers all API routes.
 * 
 * Routes:
 *   /api/auth       - Authentication (register, login, get current user)
 *   /api/projects    - Project CRUD operations
 *   /api/projects/:id/upload    - Dataset upload
 *   /api/projects/:id/analytics - Analytics & KPIs
 *   /api/projects/:id/forecast  - Forecasting
 *   /api/projects/:id/ask       - AI question answering
 *   /api/projects/:id/report    - Report generation
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const connectDB = require('./config/db');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const aiRoutes = require('./routes/aiRoutes');
const reportRoutes = require('./routes/reportRoutes');

// Initialize Express app
const app = express();

// --- Middleware ---

// Enable CORS for frontend (Vite dev server runs on port 5173)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json({ limit: '50mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve generated reports as static assets
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// --- API Routes ---

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', uploadRoutes);
app.use('/api/projects', analyticsRoutes);
app.use('/api/projects', forecastRoutes);
app.use('/api/projects', aiRoutes);
app.use('/api/projects', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI Business Analyst API is running',
    timestamp: new Date().toISOString(),
  });
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// --- Start Server ---

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
  });
});
