import { Layout, Menu, Button, Avatar, Dropdown, theme } from 'antd';
import {
  PlusCircleOutlined,
  UnorderedListOutlined,
  UserOutlined,
  LogoutOutlined,
  SoundOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

const { Header, Sider, Content } = Layout;

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <UnorderedListOutlined />,
      label: 'Danh sách thuyết minh',
    },
    {
      key: '/create',
      icon: <PlusCircleOutlined />,
      label: 'Tạo thuyết minh mới',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Tài khoản',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* === SIDEBAR === */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: '#001529',
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/dashboard')}
        >
          <SoundOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          {!collapsed && (
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              NarraTech
            </span>
          )}
        </div>

        {/* Menu điều hướng */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        {/* === HEADER === */}
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >
          {/* Nút thu gọn sidebar */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />

          {/* Avatar + dropdown menu user */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Xin chào, <strong>User</strong></span>
              <Avatar icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>

        {/* === CONTENT (thay đổi theo trang) === */}
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
