import { Layout, Button, Space, Typography, Avatar, Dropdown } from 'antd';
import {
  SoundOutlined,
  CompassOutlined,
  LockOutlined,
  GlobalOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

function TouristLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isHome = location.pathname === '/';

  const userMenuItems = [
    {
      key: 'role-info',
      disabled: true,
      label: (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          Vai trò: <strong>{user?.role === 'admin' ? 'Quản Trị Viên' : 'Khách Du Lịch'}</strong>
        </span>
      ),
    },
    {
      type: 'divider' as const,
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: 'admin',
            icon: <LockOutlined />,
            label: 'Vào trang Quản trị (Admin)',
            onClick: () => navigate('/admin'),
          },
        ]
      : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => {
        logout();
        navigate('/');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* === HEADER CHO KHÁCH DU LỊCH === */}
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          height: 70,
        }}
      >
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1677ff 0%, #00b96b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 22,
              boxShadow: '0 4px 10px rgba(22, 119, 255, 0.3)',
            }}
          >
            <SoundOutlined />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
              VN Audio Guide
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Thuyết minh Du lịch Đa ngôn ngữ
            </div>
          </div>
        </div>

        {/* Menu & Auth buttons */}
        <Space size="middle">
          <Button
            type={isHome ? 'primary' : 'text'}
            icon={<CompassOutlined />}
            onClick={() => navigate('/')}
          >
            Khám phá Địa danh
          </Button>

          {/* Nếu là Admin thì hiện nút vào Admin */}
          {user?.role === 'admin' && (
            <Button
              type="dashed"
              icon={<LockOutlined />}
              onClick={() => navigate('/admin')}
              style={{ borderColor: '#1677ff', color: '#1677ff' }}
            >
              Khu vực Quản trị (Admin)
            </Button>
          )}

          {/* Hiển thị Avatar nếu đã đăng nhập, ngược lại hiện nút Đăng nhập */}
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: '#f1f5f9',
                }}
              >
                <Avatar style={{ backgroundColor: user.role === 'admin' ? '#1677ff' : '#52c41a' }} icon={<UserOutlined />} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
                  {user.fullName}
                </span>
              </div>
            </Dropdown>
          ) : (
            <Space>
              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                style={{ borderRadius: 8 }}
              >
                Đăng Nhập
              </Button>
            </Space>
          )}
        </Space>
      </Header>

      {/* === NỘI DUNG CHÍNH === */}
      <Content style={{ padding: '0 0 40px 0' }}>
        <Outlet />
      </Content>

      {/* === FOOTER === */}
      <Footer
        style={{
          textAlign: 'center',
          background: '#0f172a',
          color: '#94a3b8',
          padding: '36px 20px',
        }}
      >
        <Space direction="vertical" size="small">
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            <GlobalOutlined style={{ marginRight: 8, color: '#38bdf8' }} />
            Hệ Thống Thuyết Minh Du Lịch Tự Động Đa Ngôn Ngữ
          </div>
          <Text style={{ color: '#94a3b8' }}>
            Đề tài Đồ án Công nghệ Phần mềm • Kiến trúc Microservices • Dịch thuật & Text-to-Speech tự động
          </Text>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
            Hỗ trợ 5 ngôn ngữ: Tiếng Việt 🇻🇳 • English 🇬🇧 • 日本語 🇯🇵 • 한국어 🇰🇷 • 中文 🇨🇳
          </div>
        </Space>
      </Footer>
    </Layout>
  );
}

export default TouristLayout;
