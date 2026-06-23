/**
 * Forecast Page
 * 
 * Displays ML-powered forecasts for business metrics.
 * Shows predicted values, confidence scores, and trend direction.
 * Includes historical vs predicted comparison chart.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Card, Row, Col, Spin, Empty, Tag, Select, message } from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import API from '../services/api';

const { Title, Text } = Typography;

const ForecastPage = () => {
  const { projectId } = useParams();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState(3);

  useEffect(() => {
    fetchForecast();
  }, [projectId, periods]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/projects/${projectId}/forecast?periods=${periods}`);
      setForecastData(response.data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        message.info('Please upload a dataset first');
      } else {
        message.error('Failed to generate forecast');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return num?.toFixed(2);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '120px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!forecastData || !forecastData.forecasts?.length) {
    return (
      <Empty
        description={
          <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
            No forecast available. Upload a dataset with numeric columns.
          </Text>
        }
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          🔮 Forecasting
        </Title>
        <Select
          value={periods}
          onChange={setPeriods}
          style={{ width: 180 }}
          options={[
            { value: 3, label: 'Next 3 Periods' },
            { value: 6, label: 'Next 6 Periods' },
            { value: 12, label: 'Next 12 Periods' },
          ]}
        />
      </div>

      {/* Forecast Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        {forecastData.forecasts.map((forecast, index) => {
          const trendColors = {
            increasing: { bg: 'rgba(67, 233, 123, 0.08)', border: 'rgba(67, 233, 123, 0.2)', text: '#43e97b' },
            decreasing: { bg: 'rgba(245, 87, 108, 0.08)', border: 'rgba(245, 87, 108, 0.2)', text: '#f5576c' },
            stable: { bg: 'rgba(79, 172, 254, 0.08)', border: 'rgba(79, 172, 254, 0.2)', text: '#4facfe' },
          };
          const colors = trendColors[forecast.trend] || trendColors.stable;

          return (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card
                style={{
                  borderRadius: '14px',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  {forecast.metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>

                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                  Current: {formatNumber(forecast.currentValue)}
                </div>

                <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                  {formatNumber(forecast.predictedValue)}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Tag
                    color={forecast.trend === 'increasing' ? 'success' : forecast.trend === 'decreasing' ? 'error' : 'blue'}
                    icon={
                      forecast.trend === 'increasing' ? <ArrowUpOutlined /> :
                      forecast.trend === 'decreasing' ? <ArrowDownOutlined /> :
                      <MinusOutlined />
                    }
                    style={{ borderRadius: '6px' }}
                  >
                    {forecast.trend}
                  </Tag>

                  <Tag
                    icon={<ThunderboltOutlined />}
                    color="purple"
                    style={{ borderRadius: '6px' }}
                  >
                    {forecast.confidence}% confidence
                  </Tag>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Prediction Chart */}
      {forecastData.forecasts.length > 0 && (
        <Card
          title={
            <span style={{ color: '#fff' }}>
              📈 Prediction Timeline — {forecastData.forecasts[0].metric}
            </span>
          }
          style={{
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          styles={{
            header: {
              background: 'transparent',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            },
          }}
        >
          {(() => {
            const forecast = forecastData.forecasts[0];
            const chartData = forecast.predictions.map((val, i) => ({
              period: `Period ${i + 1}`,
              predicted: val,
            }));
            // Add current value at the start
            chartData.unshift({
              period: 'Current',
              current: forecast.currentValue,
              predicted: forecast.currentValue,
            });

            return (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="period"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#667eea"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#667eea', r: 5 }}
                    name="Predicted"
                  />
                  {chartData[0].current && (
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke="#43e97b"
                      strokeWidth={2}
                      dot={{ fill: '#43e97b', r: 5 }}
                      name="Current"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            );
          })()}
        </Card>
      )}
    </div>
  );
};

export default ForecastPage;
