/**
 * App Layout Component
 * 
 * Wraps project pages with the sidebar navigation.
 * Uses Ant Design Layout for consistent structure.
 */

import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './Sidebar';

const { Content } = Layout;

const AppLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 220, background: '#0d0d1a' }}>
        <Content
          style={{
            padding: '24px 32px',
            minHeight: '100vh',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
