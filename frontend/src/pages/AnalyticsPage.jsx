/**
 * Analytics Page
 * 
 * Full analytics dashboard with:
 *   - KPI cards with trend indicators
 *   - Time-series trend charts (Recharts)
 *   - Segment breakdown charts
 *   - Anomaly alerts
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Card, Row, Col, Spin, Empty, Tag, message } from 'antd';
import {
  ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import API from '../services/api';

const { Title, Text } = Typography;

// Color palette for charts
const CHART_COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#a18cd1'];

const AnalyticsPage = () => {
  const { projectId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  const fetchAnalytics = async () => {
    try {
      const response = await API.get(`/projects/${projectId}/analytics`);
      setAnalytics(response.data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        message.info('Please upload a dataset first');
      } else {
        message.error('Failed to load analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format large numbers for display
  const formatNumber = (num) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '120px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Empty
        description={
          <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
            No analytics available. Upload a dataset to get started.
          </Text>
        }
      />
    );
  }

  const { kpis, trends, segments, anomalies } = analytics;

  return (
    <div>
      <Title level={3} style={{ color: '#fff', marginBottom: '24px' }}>
        📊 Analytics Dashboard
      </Title>

      {/* KPI Cards */}
      {kpis && kpis.length > 0 && (
        <>
          <Title level={5} style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
            Key Performance Indicators
          </Title>
          <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
            {kpis.map((kpi, index) => (
              <Col xs={12} sm={8} md={6} key={index}>
                <Card
                  style={{
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Color accent */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: CHART_COLORS[index % CHART_COLORS.length],
                    }}
                  />

                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                    {kpi.name}
                  </Text>

                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                    {formatNumber(kpi.value)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {kpi.trend === 'increasing' ? (
                      <Tag color="success" icon={<ArrowUpOutlined />} style={{ borderRadius: '6px' }}>
                        +{kpi.percentChange}%
                      </Tag>
                    ) : kpi.trend === 'decreasing' ? (
                      <Tag color="error" icon={<ArrowDownOutlined />} style={{ borderRadius: '6px' }}>
                        {kpi.percentChange}%
                      </Tag>
                    ) : (
                      <Tag icon={<MinusOutlined />} style={{ borderRadius: '6px' }}>
                        Stable
                      </Tag>
                    )}
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
                      {kpi.category}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Trend Charts */}
      {trends && trends.length > 0 && (
        <>
          <Title level={5} style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
            📈 Trends Over Time
          </Title>
          <Card
            style={{
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '32px',
            }}
          >
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
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
                {Object.keys(trends[0] || {})
                  .filter((key) => key !== 'date' && key !== '_count')
                  .slice(0, 4)
                  .map((key, i) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={CHART_COLORS[i]}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS[i], r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* Segment Analysis */}
      {segments && segments.length > 0 && (
        <>
          <Title level={5} style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
            🏷️ Segment Analysis
          </Title>
          <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
            {segments.map((segment, idx) => (
              <Col xs={24} md={12} key={idx}>
                <Card
                  title={
                    <span style={{ color: '#fff' }}>
                      {segment.metric} by {segment.segmentBy}
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
                  <ResponsiveContainer width="100%" height={250}>
                    {segment.data.length <= 6 ? (
                      <PieChart>
                        <Pie
                          data={segment.data}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {segment.data.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#1a1a2e',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    ) : (
                      <BarChart data={segment.data.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                          dataKey="name"
                          stroke="rgba(255,255,255,0.3)"
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        />
                        <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            background: '#1a1a2e',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" fill="#667eea" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>

                  {/* Top & Bottom Performers */}
                  {segment.topPerformer && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                        🏆 Top: <span style={{ color: '#43e97b' }}>{segment.topPerformer.name}</span> ({formatNumber(segment.topPerformer.value)})
                      </Text>
                      {segment.bottomPerformer && (
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                          ⚠️ Bottom: <span style={{ color: '#fa709a' }}>{segment.bottomPerformer.name}</span>
                        </Text>
                      )}
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* Anomaly Alerts */}
      {anomalies && anomalies.length > 0 && (
        <>
          <Title level={5} style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
            ⚠️ Detected Anomalies
          </Title>
          <Row gutter={[12, 12]}>
            {anomalies.slice(0, 6).map((anomaly, idx) => (
              <Col xs={24} sm={12} md={8} key={idx}>
                <Card
                  style={{
                    borderRadius: '12px',
                    background: anomaly.severity === 'high'
                      ? 'rgba(245, 87, 108, 0.08)'
                      : anomaly.severity === 'medium'
                      ? 'rgba(254, 225, 64, 0.08)'
                      : 'rgba(79, 172, 254, 0.08)',
                    border: `1px solid ${
                      anomaly.severity === 'high'
                        ? 'rgba(245, 87, 108, 0.2)'
                        : anomaly.severity === 'medium'
                        ? 'rgba(254, 225, 64, 0.2)'
                        : 'rgba(79, 172, 254, 0.2)'
                    }`,
                  }}
                  size="small"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text strong style={{ color: '#fff', fontSize: '13px' }}>
                      <WarningOutlined style={{ marginRight: '6px' }} />
                      {anomaly.column}
                    </Text>
                    <Tag
                      color={
                        anomaly.severity === 'high' ? 'red'
                          : anomaly.severity === 'medium' ? 'gold'
                          : 'blue'
                      }
                      style={{ borderRadius: '6px', fontSize: '11px' }}
                    >
                      {anomaly.severity}
                    </Tag>
                  </div>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', display: 'block' }}>
                    Actual: <strong style={{ color: '#fff' }}>{formatNumber(anomaly.actualValue)}</strong>
                    {' | '}
                    Expected: {formatNumber(anomaly.expectedValue)}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
