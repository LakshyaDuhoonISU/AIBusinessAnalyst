/**
 * Anomaly Detection Service
 * 
 * Identifies unusual values in numeric columns using the IQR method.
 * 
 * How IQR (Interquartile Range) method works:
 *   1. Sort the values
 *   2. Find Q1 (25th percentile) and Q3 (75th percentile)
 *   3. Calculate IQR = Q3 - Q1
 *   4. Any value below Q1 - 1.5*IQR or above Q3 + 1.5*IQR is an anomaly
 * 
 * This is a simple but effective method for detecting outliers
 * without requiring complex machine learning models.
 */

/**
 * Helper: Calculate the percentile of a sorted array
 * Uses linear interpolation between closest data points
 */
const percentile = (sortedArr, p) => {
  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (upper >= sortedArr.length) return sortedArr[lower];
  return sortedArr[lower] * (1 - weight) + sortedArr[upper] * weight;
};

/**
 * Detect anomalies in a dataset
 * 
 * @param {Array} data - Array of row objects
 * @param {Array} columnNames - Column header names
 * @param {Object} columnTypes - Column type mapping
 * @returns {Array} Array of detected anomalies with details
 */
const detectAnomalies = (data, columnNames, columnTypes) => {
  const anomalies = [];

  // Only check numeric columns for anomalies
  const numericColumns = columnNames.filter((col) => columnTypes[col] === 'number');

  numericColumns.forEach((col) => {
    // Get all valid numeric values
    const values = data
      .map((row, index) => ({ value: Number(row[col]), index }))
      .filter((item) => !isNaN(item.value));

    if (values.length < 4) return; // Need enough data points

    // Sort values for percentile calculation
    const sortedValues = values.map((v) => v.value).sort((a, b) => a - b);

    // Calculate Q1, Q3, and IQR
    const q1 = percentile(sortedValues, 25);
    const q3 = percentile(sortedValues, 75);
    const iqr = q3 - q1;

    // Define bounds for anomaly detection
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Calculate expected value (mean)
    const mean = sortedValues.reduce((a, b) => a + b, 0) / sortedValues.length;

    // Find values outside the bounds
    values.forEach((item) => {
      if (item.value < lowerBound || item.value > upperBound) {
        // Calculate how far from expected (severity)
        const deviation = Math.abs(item.value - mean) / (iqr || 1);
        let severity = 'low';
        if (deviation > 3) severity = 'high';
        else if (deviation > 2) severity = 'medium';

        anomalies.push({
          column: col,
          rowIndex: item.index,
          actualValue: Number(item.value.toFixed(2)),
          expectedValue: Number(mean.toFixed(2)),
          lowerBound: Number(lowerBound.toFixed(2)),
          upperBound: Number(upperBound.toFixed(2)),
          severity,
          type: item.value < lowerBound ? 'unusually_low' : 'unusually_high',
          description: `${col} value of ${item.value.toFixed(2)} is ${
            item.value < lowerBound ? 'below' : 'above'
          } the expected range (${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`,
        });
      }
    });
  });

  // Sort anomalies by severity (high first)
  const severityOrder = { high: 0, medium: 1, low: 2 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Return top 20 most significant anomalies
  return anomalies.slice(0, 20);
};

module.exports = { detectAnomalies };
