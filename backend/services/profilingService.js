/**
 * Data Profiling Service
 * 
 * Analyzes uploaded datasets to generate a data profile.
 * This runs automatically after a file is uploaded.
 * 
 * Calculates:
 *   - Row count
 *   - Column count  
 *   - Missing values per column
 *   - Total missing values
 *   - Duplicate rows
 *   - Data types per column
 *   - Null percentage per column
 *   - Data health score (0-100%)
 * 
 * The data health score is calculated based on:
 *   - Completeness (low missing values = higher score)
 *   - Uniqueness (low duplicates = higher score)
 */

/**
 * Generate a complete data profile for a dataset
 * 
 * @param {Array} data - Array of row objects (parsed from CSV/XLSX)
 * @param {Array} columnNames - Array of column header names
 * @param {Object} columnTypes - Object mapping column names to types
 * @returns {Object} Data profile with stats and health score
 */
const generateProfile = (data, columnNames, columnTypes) => {
  const rowCount = data.length;
  const columnCount = columnNames.length;

  // --- Missing Values Analysis ---
  // Count missing/null/empty values for each column
  const missingValues = {};
  let totalMissing = 0;

  columnNames.forEach((col) => {
    const missingCount = data.filter((row) => {
      const value = row[col];
      return value === null || value === undefined || value === '' || value === 'N/A';
    }).length;

    missingValues[col] = {
      count: missingCount,
      percentage: rowCount > 0 ? ((missingCount / rowCount) * 100).toFixed(2) : 0,
    };

    totalMissing += missingCount;
  });

  // --- Duplicate Rows Detection ---
  // Convert each row to a string and check for duplicates
  const rowStrings = data.map((row) => JSON.stringify(row));
  const uniqueRows = new Set(rowStrings);
  const duplicateCount = rowCount - uniqueRows.size;

  // --- Null Percentage ---
  const totalCells = rowCount * columnCount;
  const nullPercentage = totalCells > 0
    ? ((totalMissing / totalCells) * 100).toFixed(2)
    : 0;

  // --- Data Health Score ---
  // Higher score = fewer missing values and duplicates
  const completenessScore = totalCells > 0
    ? ((1 - totalMissing / totalCells) * 100)
    : 100;
  const uniquenessScore = rowCount > 0
    ? ((1 - duplicateCount / rowCount) * 100)
    : 100;

  // Weighted average: completeness matters more
  const healthScore = Math.round(completenessScore * 0.7 + uniquenessScore * 0.3);

  // --- Column Statistics ---
  // For numeric columns, calculate min, max, mean, and standard deviation
  const columnStats = {};
  columnNames.forEach((col) => {
    if (columnTypes[col] === 'number') {
      const values = data
        .map((row) => Number(row[col]))
        .filter((v) => !isNaN(v));

      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const mean = sum / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

        columnStats[col] = {
          min: Math.min(...values),
          max: Math.max(...values),
          mean: Number(mean.toFixed(2)),
          stdDev: Number(Math.sqrt(variance).toFixed(2)),
          sum: Number(sum.toFixed(2)),
        };
      }
    } else if (columnTypes[col] === 'string') {
      // For string columns, count unique values
      const uniqueValues = new Set(data.map((row) => row[col]).filter(Boolean));
      columnStats[col] = {
        uniqueCount: uniqueValues.size,
        topValues: Array.from(uniqueValues).slice(0, 5),
      };
    }
  });

  return {
    rowCount,
    columnCount,
    missingValues,
    totalMissing,
    duplicateCount,
    nullPercentage: Number(nullPercentage),
    healthScore,
    columnTypes,
    columnStats,
  };
};

module.exports = { generateProfile };
