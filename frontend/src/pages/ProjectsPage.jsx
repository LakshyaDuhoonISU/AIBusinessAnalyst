/**
 * Projects Page
 * 
 * Displays all projects for the logged-in user.
 * Allows creating new projects and navigating to project dashboards.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Modal, Form, Input, message, Empty, Popconfirm,
  Typography, Row, Col, Spin,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, FolderOutlined,
  LogoutOutlined, RightOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';

const { Title, Text, Paragraph } = Typography;

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await API.get('/projects');
      setProjects(response.data.data);
    } catch (error) {
      message.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      await API.post('/projects', values);
      message.success('Project created!');
      setModalOpen(false);
      form.resetFields();
      fetchProjects();
    } catch (error) {
      message.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/projects/${id}`);
      message.success('Project deleted');
      fetchProjects();
    } catch (error) {
      message.error('Failed to delete project');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Project card color palette for visual variety
  const cardColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #111133 50%, #0d0d2b 100%)',
        padding: '32px 48px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              margin: 0,
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Welcome, {user?.name || 'User'} 👋
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
            Manage your business analysis projects
          </Text>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setModalOpen(true)}
            id="create-project-btn"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              height: '44px',
            }}
          >
            New Project
          </Button>
          <Button
            icon={<LogoutOutlined />}
            size="large"
            onClick={handleLogout}
            id="logout-btn"
            style={{
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              height: '44px',
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '120px' }}>
          <Spin size="large" />
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '80px' }}>
          <Empty
            description={
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>
                No projects yet. Create your first one!
              </Text>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
              }}
            >
              Create Project
            </Button>
          </Empty>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {projects.map((project, index) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={project._id}>
              <Card
                hoverable
                onClick={() => navigate(`/projects/${project._id}`)}
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                styles={{
                  body: { padding: 0 },
                }}
              >
                {/* Color banner */}
                <div
                  style={{
                    height: '6px',
                    background: cardColors[index % cardColors.length],
                  }}
                />

                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: cardColors[index % cardColors.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        marginBottom: '12px',
                      }}
                    >
                      <FolderOutlined style={{ color: '#fff' }} />
                    </div>

                    <Popconfirm
                      title="Delete this project?"
                      description="All datasets and reports will be deleted."
                      onConfirm={(e) => {
                        e.stopPropagation();
                        handleDelete(project._id);
                      }}
                      onCancel={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      />
                    </Popconfirm>
                  </div>

                  <Title level={5} style={{ color: '#fff', margin: '0 0 4px 0' }}>
                    {project.name}
                  </Title>

                  <Paragraph
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '13px',
                      margin: '0 0 16px 0',
                    }}
                    ellipsis={{ rows: 2 }}
                  >
                    {project.description || 'No description'}
                  </Paragraph>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </Text>
                    <RightOutlined style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }} />
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create Project Modal */}
      <Modal
        title={<span style={{ color: '#fff' }}>Create New Project</span>}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        styles={{
          content: {
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
          },
          header: {
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          },
        }}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical" style={{ marginTop: '16px' }}>
          <Form.Item
            name="name"
            label={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Project Name</span>}
            rules={[{ required: true, message: 'Enter project name' }]}
          >
            <Input
              placeholder="e.g., Sales Analysis Q4"
              id="project-name-input"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ color: 'rgba(255,255,255,0.7)' }}>Description</span>}
          >
            <Input.TextArea
              placeholder="Brief description of the project"
              rows={3}
              id="project-desc-input"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={creating}
            block
            id="project-create-submit"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              height: '42px',
              fontWeight: 600,
            }}
          >
            Create Project
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
