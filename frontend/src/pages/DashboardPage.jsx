/**
 * Dashboard Page
 * 
 * Project overview showing uploaded datasets and data profile summary.
 * Allows users to upload new datasets (CSV/XLSX).
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography, Upload, Button, message, Card, Row, Col,
  Statistic, Progress, Table, Tag, Spin, Empty,
} from 'antd';
import {
  UploadOutlined, FileExcelOutlined, CheckCircleOutlined,
  WarningOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import API from '../services/api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const DashboardPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [projRes, dataRes] = await Promise.all([
        API.get(`/projects/${projectId}`),
        API.get(`/projects/${projectId}/datasets`),
      ]);
      setProject(projRes.data.data);
      setDatasets(dataRes.data.data);

      // Fetch analytics if datasets exist
      if (dataRes.data.data.length > 0) {
        try {
          const analyticsRes = await API.get(`/projects/${projectId}/analytics`);
          setAnalytics(analyticsRes.data.data);
        } catch (err) {
          console.log('Analytics not available yet');
        }
      }
    } catch (error) {
      message.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  // Custom upload handler
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await API.post(`/projects/${projectId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success(`${file.name} uploaded successfully!`);
      onSuccess('ok');
      fetchData(); // Refresh data
    } catch (error) {
      message.error('Upload failed: ' + (error.response?.data?.message || error.message));
      onError(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '120px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const profile = analytics?.profile;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          {project?.name || 'Project Dashboard'}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
          {project?.description || 'Upload datasets to get started'}
        </Text>
      </div>

      {/* Upload Area */}
      <Card
        style={{
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px',
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Dragger
          customRequest={handleUpload}
          accept=".csv,.xlsx,.xls"
          showUploadList={false}
          disabled={uploading}
          style={{
            background: 'rgba(102, 126, 234, 0.05)',
            border: '2px dashed rgba(102, 126, 234, 0.3)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <p style={{ marginBottom: '8px' }}>
            <UploadOutlined style={{ fontSize: '36px', color: '#667eea' }} />
          </p>
          <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>
            {uploading ? 'Uploading...' : 'Click or drag file to upload'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            Supports CSV and XLSX files (max 50MB)
          </p>
        </Dragger>
      </Card>

      {/* Data Profile Summary */}
      {profile && (
        <>
          <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
            📊 Data Profile
          </Title>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={12} sm={8} md={6}>
              <Card
                style={{
                  borderRadius: '12px',
                  background: 'rgba(102, 126, 234, 0.08)',
                  border: '1px solid rgba(102, 126, 234, 0.2)',
                }}
              >
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>Rows</span>}
                  value={profile.rowCount}
                  valueStyle={{ color: '#667eea', fontWeight: 700 }}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card
                style={{
                  borderRadius: '12px',
                  background: 'rgba(67, 233, 123, 0.08)',
                  border: '1px solid rgba(67, 233, 123, 0.2)',
                }}
              >
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>Columns</span>}
                  value={profile.columnCount}
                  valueStyle={{ color: '#43e97b', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card
                style={{
                  borderRadius: '12px',
                  background: 'rgba(250, 112, 154, 0.08)',
                  border: '1px solid rgba(250, 112, 154, 0.2)',
                }}
              >
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>Missing Values</span>}
                  value={profile.totalMissing}
                  valueStyle={{ color: '#fa709a', fontWeight: 700 }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={6}>
              <Card
                style={{
                  borderRadius: '12px',
                  background: 'rgba(79, 172, 254, 0.08)',
                  border: '1px solid rgba(79, 172, 254, 0.2)',
                }}
              >
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.5)' }}>Duplicates</span>}
                  value={profile.duplicateCount}
                  valueStyle={{ color: '#4facfe', fontWeight: 700 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Health Score */}
          <Card
            style={{
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <Progress
                type="circle"
                percent={profile.healthScore}
                size={100}
                strokeColor={
                  profile.healthScore >= 80
                    ? '#43e97b'
                    : profile.healthScore >= 60
                    ? '#fee140'
                    : '#f5576c'
                }
                trailColor="rgba(255,255,255,0.06)"
                format={(percent) => (
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '20px' }}>
                    {percent}%
                  </span>
                )}
              />
              <div>
                <Title level={4} style={{ color: '#fff', margin: 0 }}>
                  Data Health Score
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {profile.healthScore >= 80
                    ? 'Excellent data quality! Your dataset is clean and ready for analysis.'
                    : profile.healthScore >= 60
                    ? 'Good data quality with some issues. Consider cleaning missing values.'
                    : 'Data quality needs improvement. Multiple issues detected.'}
                </Text>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Datasets Table */}
      <Title level={4} style={{ color: '#fff', marginBottom: '16px' }}>
        📁 Uploaded Datasets
      </Title>
      {datasets.length === 0 ? (
        <Empty
          description={
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
              No datasets uploaded yet. Upload a CSV or XLSX file above.
            </Text>
          }
        />
      ) : (
        <Card
          style={{
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={datasets}
            rowKey="_id"
            pagination={false}
            style={{ background: 'transparent' }}
            columns={[
              {
                title: 'File Name',
                dataIndex: 'originalName',
                render: (name) => (
                  <span style={{ color: '#fff' }}>
                    <FileExcelOutlined style={{ marginRight: '8px', color: '#43e97b' }} />
                    {name}
                  </span>
                ),
              },
              {
                title: 'Rows',
                dataIndex: 'rows',
                render: (val) => <span style={{ color: '#fff' }}>{val?.toLocaleString()}</span>,
              },
              {
                title: 'Columns',
                dataIndex: 'columns',
                render: (val) => <span style={{ color: '#fff' }}>{val}</span>,
              },
              {
                title: 'Uploaded',
                dataIndex: 'uploadDate',
                render: (date) => (
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {new Date(date).toLocaleString()}
                  </span>
                ),
              },
              {
                title: 'Status',
                render: () => (
                  <Tag
                    icon={<CheckCircleOutlined />}
                    color="success"
                  >
                    Processed
                  </Tag>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
