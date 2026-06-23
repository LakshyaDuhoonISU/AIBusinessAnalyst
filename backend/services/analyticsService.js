/**
 * Analytics Service
 * 
 * Performs data analysis on uploaded datasets.
 * Generates trends, segment breakdowns, and performance rankings.
 * 
 * Features:
 *   - Time-series trend analysis (group data by date columns)
 *   - Segment analysis (group by categorical columns like Region, Product)
 *   - Top/Bottom performer identification
 *   - Growth rate calculations
 */

/**
 * Generate time-series trends from the dataset
 * Groups data by date columns and calculates aggregates
 * 
 * @param {Array} data - Parsed dataset rows
 * @param {Array} columnNames - Column headers
 * @param {Object} columnTypes - Column type mapping
 * @returns {Array} Trend data grouped by date
 */
const generateTrends = (data, columnNames, columnTypes) => {
  // Find date columns
  const dateColumns = columnNames.filter((col) => columnTypes[col] === 'date');
  // Find numeric columns (values to trend)
  const numericColumns = columnNames.filter((col) => columnTypes[col] === 'number');

  if (dateColumns.length === 0 || numericColumns.length === 0) {
    return [];
  }

  // Use the first date column as the time axis
  const dateCol = dateColumns[0];

  // Group data by date (month-year format for cleaner charts)
  const groupedByDate = {};

  data.forEach((row) => {
    const dateValue = row[dateCol];
    if (!dateValue) return;

    // Parse date and format as YYYY-MM for monthly grouping
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!groupedByDate[key]) {
      groupedByDate[key] = { date: key, _count: 0 };
      numericColumns.forEach((col) => {
        groupedByDate[key][col] = 0;
      });
    }

    groupedByDate[key]._count += 1;

    // Sum numeric values for each date group
    numericColumns.forEach((col) => {
      const value = Number(row[col]);
      if (!isNaN(value)) {
        groupedByDate[key][col] += value;
      }
    });
  });

  // Convert to array and sort by date
  const trends = Object.values(groupedByDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Round numeric values for cleaner display
  trends.forEach((point) => {
    numericColumns.forEach((col) => {
      point[col] = Number(point[col].toFixed(2));
    });
  });

  return trends;
};

/**
 * Generate segment breakdowns
 * Groups data by categorical columns and sums numeric values
 * 
 * @param {Array} data - Parsed dataset rows
 * @param {Array} columnNames - Column headers
 * @param {Object} columnTypes - Column type mapping
 * @returns {Array} Array of segment analysis results
 */
const generateSegments = (data, columnNames, columnTypes) => {
  // Find categorical (string) columns for grouping
  const categoryColumns = columnNames.filter((col) => columnTypes[col] === 'string');
  // Find numeric columns for aggregation
  const numericColumns = columnNames.filter((col) => columnTypes[col] === 'number');

  if (categoryColumns.length === 0 || numericColumns.length === 0) {
    return [];
  }

  const segments = [];

  // For each categorical column, create a segment breakdown
  categoryColumns.forEach((catCol) => {
    // Skip columns with too many unique values (likely IDs, not categories)
    const uniqueValues = new Set(data.map((row) => row[catCol]).filter(Boolean));
    if (uniqueValues.size > 20 || uniqueValues.size < 2) return;

    // Use the first numeric column as the primary metric
    const metricCol = numericColumns[0];

    // Group by category and sum the metric
    const grouped = {};
    data.forEach((row) => {
      const category = row[catCol];
      if (!category) return;

      if (!grouped[category]) {
        grouped[category] = 0;
      }

      const value = Number(row[metricCol]);
      if (!isNaN(value)) {
        grouped[category] += value;
      }
    });

    // Convert to array format for charts
    const segmentData = Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);

    segments.push({
      segmentBy: catCol,
      metric: metricCol,
      data: segmentData,
      topPerformer: segmentData[0] || null,
      bottomPerformer: segmentData[segmentData.length - 1] || null,
    });
  });

  return segments;
};

/**
 * Calculate growth rates between periods
 * 
 * @param {Array} trends - Time-series trend data
 * @param {Array} numericColumns - Columns to calculate growth for
 * @returns {Array} Growth rates for each metric
 */
const calculateGrowthRates = (trends, numericColumns) => {
  if (trends.length < 2) return [];

  const growthRates = [];

  numericColumns.forEach((col) => {
    const latest = trends[trends.length - 1][col];
    const previous = trends[trends.length - 2][col];

    if (previous !== 0 && latest !== undefined && previous !== undefined) {
      const growth = ((latest - previous) / Math.abs(previous)) * 100;

      growthRates.push({
        metric: col,
        currentValue: latest,
        previousValue: previous,
        growthRate: Number(growth.toFixed(2)),
        direction: growth > 0 ? 'up' : growth < 0 ? 'down' : 'flat',
      });
    }
  });

  return growthRates;
};

module.exports = { generateTrends, generateSegments, calculateGrowthRates };
