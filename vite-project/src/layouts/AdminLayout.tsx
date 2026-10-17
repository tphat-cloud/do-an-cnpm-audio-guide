import { Layout, Menu, Button, Avatar, Space, Tag, Dropdown } from 'antd';
import {
  PlusCircleOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  DashboardOutlined,
  ApiOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const { Header, Sider, Content } = Layout;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: 'Danh sách Điểm Du Lịch',
    },
    {
      key: '/admin/create',
      icon: <PlusCircleOutlined />,
      label: 'Thêm Điểm Mới (Tự Động TTS)',
    },
  ];

  const adminMenuItems = [
    {
      key: 'tourist-home',
      icon: <ArrowLeftOutlined />,
      label: 'Về trang Khách Du Lịch',
      onClick: () => navigate('/'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* === ADMIN SIDEBAR === */}
      <Sider
        width={250}
        style={{
          background: '#001529',
        }}
      >
        <div
          style={{
            height: 70,
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            gap: 10,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#1677ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            AD
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
              Admin Portal
            </div>
            <div style={{ color: '#64748b', fontSize: 11 }}>Quản trị Audio Guide</div>
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 12 }}
        />

        {/* Nút quay lại giao diện khách */}
        <div style={{ position: 'absolute', bottom: 20, left: 16, right: 16 }}>
          <Button
            type="dashed"
            ghost
            block
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            style={{ borderRadius: 8 }}
          >
            Về trang Khách Du Lịch
          </Button>
        </div>
      </Sider>

      <Layout>
        {/* === ADMIN HEADER === */}
        <Header
          style={{
            background: '#ffffff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            height: 70,
          }}
        >
          <Space>
            <Tag color="geekblue" icon={<ApiOutlined />}>
              Microservices: <strong>Active</strong>
            </Tag>
            <Tag color="cyan">MySQL: <strong>Connected</strong></Tag>
          </Space>

          <Dropdown menu={{ items: adminMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#475569' }}>
                Xin chào, <strong>{user?.fullName || 'Quản Trị Viên'}</strong>
              </span>
              <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>

        {/* === NỘI DUNG ADMIN === */}
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
