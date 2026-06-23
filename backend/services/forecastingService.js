/**
 * Forecasting Service
 * 
 * Runs the Python forecasting script as a child process.
 * Sends dataset data via stdin and reads predictions from stdout.
 * 
 * If Python is not available, falls back to a simple JavaScript
 * implementation using linear trend calculation.
 */

const { spawn } = require('child_process');
const path = require('path');

/**
 * Run the Python forecasting script
 * 
 * @param {Array} data - Parsed dataset rows
 * @param {Array} columnNames - Column headers
 * @param {Object} columnTypes - Column type mapping
 * @param {Number} periods - Number of future periods to predict (default: 3)
 * @returns {Promise<Object>} Forecast results
 */
const runForecast = (data, columnNames, columnTypes, periods = 3) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../ml/forecast.py');

    // Prepare input data for the Python script
    const inputData = JSON.stringify({
      data,
      columnNames,
      columnTypes,
      periods,
    });

    // Spawn Python process
    const python = spawn('python3', [scriptPath]);

    let stdout = '';
    let stderr = '';

    // Collect output from the Python script
    python.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    python.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Python forecast error:', stderr);
        // Fall back to JavaScript implementation
        resolve(jsFallbackForecast(data, columnNames, columnTypes, periods));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        if (result.error) {
          console.error('Forecast error:', result.error);
          resolve(jsFallbackForecast(data, columnNames, columnTypes, periods));
        } else {
          resolve(result);
        }
      } catch (parseError) {
        console.error('Parse error:', parseError.message);
        resolve(jsFallbackForecast(data, columnNames, columnTypes, periods));
      }
    });

    python.on('error', (err) => {
      console.error('Python not available:', err.message);
      // Fall back to JavaScript implementation
      resolve(jsFallbackForecast(data, columnNames, columnTypes, periods));
    });

    // Send data to the Python script via stdin
    python.stdin.write(inputData);
    python.stdin.end();
  });
};

/**
 * JavaScript fallback forecast (used when Python is not available)
 * Simple linear trend calculation
 */
const jsFallbackForecast = (data, columnNames, columnTypes, periods) => {
  const numericColumns = columnNames.filter((col) => columnTypes[col] === 'number');
  const forecasts = [];

  numericColumns.forEach((col) => {
    const values = data
      .map((row) => Number(row[col]))
      .filter((v) => !isNaN(v));

    if (values.length < 3) return;

    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    // Calculate slope using least squares
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += (i - xMean) * (i - xMean);
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Calculate R²
    const yPred = values.map((_, i) => slope * i + intercept);
    const ssRes = values.reduce((sum, y, i) => sum + Math.pow(y - yPred[i], 2), 0);
    const ssTot = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

    // Generate predictions
    const predictions = [];
    for (let i = n; i < n + periods; i++) {
      predictions.push(Number((slope * i + intercept).toFixed(2)));
    }

    forecasts.push({
      metric: col,
      currentValue: Number(values[n - 1].toFixed(2)),
      predictedValue: predictions[predictions.length - 1],
      confidence: Math.round(rSquared * 100),
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      predictions,
    });
  });

  return { forecasts };
};

module.exports = { runForecast };
