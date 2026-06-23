/**
 * Reports Page
 * 
 * Generate and manage executive reports.
 * Supports PDF generation and download.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography, Button, Card, Empty, Spin, message, Tag, List,
} from 'antd';
import {
  FileTextOutlined, DownloadOutlined, PlusOutlined,
  ClockCircleOutlined, FilePdfOutlined,
} from '@ant-design/icons';
import API from '../services/api';

const { Title, Text, Paragraph } = Typography;

const ReportsPage = () => {
  const { projectId } = useParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    try {
      const response = await API.get(`/projects/${projectId}/report`);
      setReports(response.data.data);
    } catch (error) {
      console.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await API.post(`/projects/${projectId}/report`);
      message.success('Executive report generated!');
      fetchReports();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (filePath) => {
    window.open(`https://aibusinessanalyst.onrender.com${filePath}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '120px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            📄 Executive Reports
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
            Generate and download business reports
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          loading={generating}
          onClick={handleGenerate}
          id="generate-report-btn"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            height: '44px',
          }}
        >
          Generate Report
        </Button>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '60px' }}>
          <Empty
            description={
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
                No reports generated yet. Click "Generate Report" to create one.
              </Text>
            }
          >
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              loading={generating}
              onClick={handleGenerate}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
              }}
            >
              Generate First Report
            </Button>
          </Empty>
        </div>
      ) : (
        <List
          dataSource={reports}
          renderItem={(report) => (
            <Card
              style={{
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FilePdfOutlined style={{ color: '#fff', fontSize: '18px' }} />
                    </div>

                    <div>
                      <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block' }}>
                        Executive Report
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                        <ClockCircleOutlined style={{ marginRight: '4px' }} />
                        {new Date(report.createdAt).toLocaleString()}
                      </Text>
                    </div>
                  </div>

                  <Tag color="purple" style={{ borderRadius: '6px', marginBottom: '12px' }}>
                    {report.reportType}
                  </Tag>

                  {/* Report Preview */}
                  {report.reportContent && (
                    <Paragraph
                      style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '13px',
                        lineHeight: '1.7',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '200px',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                      ellipsis={{ rows: 8 }}
                    >
                      {report.reportContent}
                    </Paragraph>
                  )}
                </div>

                {/* Download Button */}
                {report.filePath && (
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(report.filePath)}
                    style={{
                      background: 'rgba(67, 233, 123, 0.15)',
                      border: '1px solid rgba(67, 233, 123, 0.3)',
                      borderRadius: '10px',
                      color: '#43e97b',
                      marginLeft: '16px',
                    }}
                  >
                    Download PDF
                  </Button>
                )}
              </div>
            </Card>
          )}
        />
      )}
    </div>
  );
};

export default ReportsPage;
