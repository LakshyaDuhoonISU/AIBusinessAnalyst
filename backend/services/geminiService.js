/**
 * Gemini AI Service (via OpenRouter)
 * 
 * Connects to OpenRouter API to use the google/gemma-4-31b-it:free model.
 * Acts as a Senior Business Analyst to analyze data and answer questions.
 * 
 * Features:
 *   - Ask business questions about datasets
 *   - Auto-generate insights (findings, risks, opportunities)
 *   - Generate executive report content
 * 
 * The service gracefully degrades with placeholder responses
 * if no API key is configured.
 */

const axios = require('axios');

// OpenRouter API configuration
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemma-4-31b-it:free';

/**
 * Helper: Prepare a data summary for the AI prompt
 * We can't send the entire dataset, so we create a summary
 */
const prepareDataSummary = (data, columnNames, columnTypes, kpis) => {
  // Take a sample of rows (first 20 and last 10)
  const sampleRows = data.length > 30
    ? [...data.slice(0, 20), ...data.slice(-10)]
    : data;

  return {
    totalRows: data.length,
    columns: columnNames.map((col) => ({
      name: col,
      type: columnTypes[col],
    })),
    sampleData: sampleRows.slice(0, 10),
    kpis: kpis || [],
  };
};

/**
 * Send a prompt to the AI model via OpenRouter
 * 
 * @param {String} systemPrompt - System instructions for the AI
 * @param {String} userPrompt - The user's question/request
 * @returns {String} AI response text
 */
const callAI = async (systemPrompt, userPrompt) => {
  const apiKey = process.env.OPENROUTER_API_KEY;

  // If no API key, return a placeholder response
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return generatePlaceholderResponse(userPrompt);
  }

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'AI Business Analyst',
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    return generatePlaceholderResponse(userPrompt);
  }
};

/**
 * Ask a business question about the dataset
 * 
 * @param {String} question - User's question
 * @param {Array} data - Dataset rows
 * @param {Array} columnNames - Column headers
 * @param {Object} columnTypes - Column types
 * @param {Array} kpis - Detected KPIs
 * @returns {String} AI analysis response
 */
const askQuestion = async (question, data, columnNames, columnTypes, kpis) => {
  const dataSummary = prepareDataSummary(data, columnNames, columnTypes, kpis);

  const systemPrompt = `You are a Senior Business Analyst with expertise in data analytics, business intelligence, and strategic consulting.

Your role is to analyze business data and provide actionable insights to managers and executives.

Always respond in clear, professional business language. Structure your response with:
- Direct answer to the question
- Supporting data points
- Recommendations if applicable

Keep responses concise but thorough.`;

  const userPrompt = `Here is the dataset information:

Dataset Summary:
- Total Rows: ${dataSummary.totalRows}
- Columns: ${dataSummary.columns.map((c) => `${c.name} (${c.type})`).join(', ')}

Key Performance Indicators:
${dataSummary.kpis.map((k) => `- ${k.name}: ${k.value} (${k.trend}, ${k.percentChange}% change)`).join('\n')}

Sample Data (first 10 rows):
${JSON.stringify(dataSummary.sampleData, null, 2)}

Question: ${question}

Please provide a detailed business analysis answering this question.`;

  return await callAI(systemPrompt, userPrompt);
};

/**
 * Auto-generate insights from the dataset
 * 
 * @param {Array} data - Dataset rows
 * @param {Array} columnNames - Column headers
 * @param {Object} columnTypes - Column types
 * @param {Array} kpis - Detected KPIs
 * @param {Array} anomalies - Detected anomalies
 * @returns {String} AI-generated insights
 */
const generateInsights = async (data, columnNames, columnTypes, kpis, anomalies) => {
  const dataSummary = prepareDataSummary(data, columnNames, columnTypes, kpis);

  const systemPrompt = `You are a Senior Business Analyst. Analyze the provided dataset and generate a comprehensive business insights report.

Structure your response EXACTLY as follows:

## Executive Summary
(2-3 sentence overview)

## Key Findings
(3-5 bullet points with specific data references)

## Business Risks
(2-3 identified risks with severity)

## Opportunities
(2-3 growth opportunities)

## Recommendations
(3-5 actionable recommendations)

Use specific numbers and percentages from the data. Write in clear business language suitable for executives.`;

  const userPrompt = `Analyze this dataset and generate insights:

Dataset: ${dataSummary.totalRows} rows, ${dataSummary.columns.length} columns
Columns: ${dataSummary.columns.map((c) => c.name).join(', ')}

KPIs:
${dataSummary.kpis.map((k) => `- ${k.name}: ${k.value} (${k.trend}, ${k.percentChange}% change)`).join('\n')}

Anomalies Detected: ${anomalies ? anomalies.length : 0}
${anomalies ? anomalies.slice(0, 5).map((a) => `- ${a.column}: actual ${a.actualValue} vs expected ${a.expectedValue} (${a.severity} severity)`).join('\n') : 'None'}

Sample Data:
${JSON.stringify(dataSummary.sampleData, null, 2)}

Generate comprehensive business insights.`;

  return await callAI(systemPrompt, userPrompt);
};

/**
 * Generate executive report content using AI
 */
const generateReportContent = async (data, columnNames, columnTypes, kpis, anomalies, forecasts) => {
  const dataSummary = prepareDataSummary(data, columnNames, columnTypes, kpis);

  const systemPrompt = `You are a Senior Business Analyst creating an Executive Report. 
Write a professional, detailed report with the following sections:

1. Executive Summary
2. Key Findings  
3. Top Risks
4. Opportunities
5. Recommendations
6. Forecast Summary

Use professional business language. Include specific numbers and data points.
Format with clear headers and bullet points.`;

  const userPrompt = `Generate an executive report for this dataset:

Dataset: ${dataSummary.totalRows} rows
KPIs: ${dataSummary.kpis.map((k) => `${k.name}: ${k.value}`).join(', ')}
Anomalies: ${anomalies ? anomalies.length : 0} detected
Forecasts: ${forecasts ? forecasts.map((f) => `${f.metric}: ${f.predictedValue} (${f.trend})`).join(', ') : 'Not available'}

Sample Data:
${JSON.stringify(dataSummary.sampleData.slice(0, 5), null, 2)}`;

  return await callAI(systemPrompt, userPrompt);
};

/**
 * Placeholder response when API key is not configured
 * Generates a basic analysis based on the question
 */
const generatePlaceholderResponse = (prompt) => {
  return `## AI Analysis

> **Note:** This is a placeholder response. Configure your OpenRouter API key in the .env file to get AI-powered insights.

### Based on your data:

1. **Key Observation**: The dataset shows interesting patterns that warrant further investigation. Multiple metrics show trending behavior over the analyzed period.

2. **Recommendation**: Consider analyzing the top-performing segments to identify success factors that can be replicated across underperforming areas.

3. **Risk Factor**: Monitor metrics that show declining trends, as they may indicate emerging business challenges.

4. **Opportunity**: The data suggests potential for growth in segments that currently show positive momentum.

---

*To enable AI-powered analysis, add your OpenRouter API key to the backend .env file:*
\`OPENROUTER_API_KEY=your_key_here\`

*Get a free key at: https://openrouter.ai/keys*`;
};

module.exports = { askQuestion, generateInsights, generateReportContent };
