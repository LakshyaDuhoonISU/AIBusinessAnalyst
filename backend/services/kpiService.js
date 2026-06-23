/**
 * KPI Detection Service
 * 
 * Automatically identifies Key Performance Indicators (KPIs) from datasets.
 * Uses pattern matching on column names to detect business metrics.
 * 
 * Supported KPI categories:
 *   - Sales: Revenue, Orders, Profit, Average Order Value
 *   - Marketing: Clicks, CTR, Conversion Rate, ROAS, Impressions
 *   - Customer: Customers, Retention, Churn, LTV
 *   - Finance: Net Income, Expenses, Budget, Variance
 *   - Inventory: Stock Level, Units Sold, Reorder Point
 * 
 * For each detected KPI, calculates:
 *   - Total/Average value
 *   - Trend direction (comparing first half vs second half)
 *   - Percentage change
 */

/**
 * KPI patterns: Maps common column name patterns to KPI categories
 * Each pattern has a name, matching keywords, and aggregation method
 */
const KPI_PATTERNS = [
  // Sales KPIs
  { name: 'Revenue', keywords: ['revenue', 'sales', 'total_sales', 'gross_sales'], agg: 'sum', category: 'Sales' },
  { name: 'Profit', keywords: ['profit', 'net_profit', 'gross_profit'], agg: 'sum', category: 'Sales' },
  { name: 'Orders', keywords: ['orders', 'order_count', 'total_orders', 'units_sold'], agg: 'sum', category: 'Sales' },

  // Marketing KPIs
  { name: 'Clicks', keywords: ['clicks', 'total_clicks'], agg: 'sum', category: 'Marketing' },
  { name: 'Impressions', keywords: ['impressions', 'views', 'total_impressions'], agg: 'sum', category: 'Marketing' },
  { name: 'CTR', keywords: ['ctr', 'click_through_rate'], agg: 'avg', category: 'Marketing' },
  { name: 'Conversion Rate', keywords: ['conversion', 'conversion_rate', 'conversions'], agg: 'avg', category: 'Marketing' },
  { name: 'ROAS', keywords: ['roas', 'return_on_ad_spend'], agg: 'avg', category: 'Marketing' },
  { name: 'Spend', keywords: ['spend', 'ad_spend', 'cost', 'marketing_spend'], agg: 'sum', category: 'Marketing' },

  // Customer KPIs
  { name: 'Customers', keywords: ['customers', 'total_customers', 'customer_count', 'new_customers'], agg: 'sum', category: 'Customer' },
  { name: 'Retention Rate', keywords: ['retention', 'retention_rate'], agg: 'avg', category: 'Customer' },
  { name: 'Churn', keywords: ['churn', 'churn_rate', 'churned'], agg: 'avg', category: 'Customer' },
  { name: 'LTV', keywords: ['ltv', 'lifetime_value', 'customer_lifetime_value'], agg: 'avg', category: 'Customer' },

  // Finance KPIs
  { name: 'Net Income', keywords: ['net_income', 'income', 'net_revenue'], agg: 'sum', category: 'Finance' },
  { name: 'Expenses', keywords: ['expenses', 'total_expenses', 'cost'], agg: 'sum', category: 'Finance' },
  { name: 'Budget', keywords: ['budget', 'allocated_budget'], agg: 'sum', category: 'Finance' },
  { name: 'Variance', keywords: ['variance', 'budget_variance'], agg: 'sum', category: 'Finance' },

  // Inventory KPIs
  { name: 'Stock Level', keywords: ['stock', 'stock_level', 'inventory', 'quantity'], agg: 'avg', category: 'Inventory' },
  { name: 'Reorder Point', keywords: ['reorder', 'reorder_point'], agg: 'avg', category: 'Inventory' },
];

/**
 * Detect KPIs from a dataset
 * 
 * @param {Array} data - Array of row objects
 * @param {Array} columnNames - Column header names
 * @param {Object} columnTypes - Column type mapping
 * @returns {Array} Array of detected KPI objects
 */
const detectKPIs = (data, columnNames, columnTypes) => {
  const kpis = [];

  // Only look at numeric columns for KPIs
  const numericColumns = columnNames.filter((col) => columnTypes[col] === 'number');

  numericColumns.forEach((col) => {
    // Normalize column name for matching (lowercase, replace spaces with underscores)
    const normalizedCol = col.toLowerCase().replace(/\s+/g, '_');

    // Try to match this column to a known KPI pattern
    const matchedPattern = KPI_PATTERNS.find((pattern) =>
      pattern.keywords.some((keyword) => normalizedCol.includes(keyword))
    );

    if (matchedPattern) {
      // Get all numeric values for this column
      const values = data
        .map((row) => Number(row[col]))
        .filter((v) => !isNaN(v));

      if (values.length === 0) return;

      // Calculate the KPI value based on aggregation method
      let kpiValue;
      if (matchedPattern.agg === 'sum') {
        kpiValue = values.reduce((a, b) => a + b, 0);
      } else {
        kpiValue = values.reduce((a, b) => a + b, 0) / values.length;
      }

      // Calculate trend by comparing first half vs second half of data
      const midpoint = Math.floor(values.length / 2);
      const firstHalf = values.slice(0, midpoint);
      const secondHalf = values.slice(midpoint);

      const firstHalfAvg = firstHalf.length > 0
        ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
        : 0;
      const secondHalfAvg = secondHalf.length > 0
        ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
        : 0;

      // Calculate percentage change between halves
      const percentChange = firstHalfAvg !== 0
        ? (((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100).toFixed(1)
        : 0;

      // Determine trend direction
      let trend = 'stable';
      if (percentChange > 2) trend = 'increasing';
      else if (percentChange < -2) trend = 'decreasing';

      kpis.push({
        name: matchedPattern.name,
        column: col,
        value: Number(kpiValue.toFixed(2)),
        aggregation: matchedPattern.agg,
        category: matchedPattern.category,
        trend,
        percentChange: Number(percentChange),
      });
    }
  });

  // If no KPIs were matched, create generic KPIs from numeric columns
  if (kpis.length === 0) {
    numericColumns.slice(0, 4).forEach((col) => {
      const values = data.map((row) => Number(row[col])).filter((v) => !isNaN(v));
      if (values.length === 0) return;

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;

      kpis.push({
        name: col.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        column: col,
        value: Number(sum.toFixed(2)),
        aggregation: 'sum',
        category: 'General',
        trend: 'stable',
        percentChange: 0,
      });
    });
  }

  return kpis;
};

module.exports = { detectKPIs };
