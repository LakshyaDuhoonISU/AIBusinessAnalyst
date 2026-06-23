/**
 * Sidebar Navigation Component
 * 
 * Shows navigation links for project pages:
 *   - Dashboard (overview of uploaded datasets)
 *   - Analytics (KPIs, trends, segments)
 *   - Forecast (future predictions)
 *   - Ask Analyst (AI Q&A)
 *   - Reports (generate/download reports)
 */

import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  MessageOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();

  // Determine which menu item is active based on current path
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/analytics')) return 'analytics';
    if (path.includes('/forecast')) return 'forecast';
    if (path.includes('/ask')) return 'ask';
    if (path.includes('/reports')) return 'reports';
    return 'dashboard';
  };

  // Menu items for project navigation
  const menuItems = [
    {
      key: 'back',
      icon: <ArrowLeftOutlined />,
      label: 'All Projects',
      onClick: () => navigate('/projects'),
    },
    { type: 'divider' },
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate(`/projects/${projectId}`),
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      onClick: () => navigate(`/projects/${projectId}/analytics`),
    },
    {
      key: 'forecast',
      icon: <LineChartOutlined />,
      label: 'Forecast',
      onClick: () => navigate(`/projects/${projectId}/forecast`),
    },
    {
      key: 'ask',
      icon: <MessageOutlined />,
      label: 'Ask Analyst',
      onClick: () => navigate(`/projects/${projectId}/ask`),
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
      onClick: () => navigate(`/projects/${projectId}/reports`),
    },
  ];

  return (
    <Sider
      width={220}
      style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #111133 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}
        >
          📊 AI Analyst
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{
          background: 'transparent',
          borderRight: 'none',
          marginTop: '8px',
        }}
        theme="dark"
      />
    </Sider>
  );
};

export default Sidebar;
