import { AudioOutlined, EnvironmentOutlined, LogoutOutlined } from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../store/useAdminStore';

const { Sider, Content } = Layout;

/** Thanh menu bên trái dùng chung cho 7.1.4 và 7.1.5. */
const MENU_ITEMS: MenuProps['items'] = [
  { key: '/admin', icon: <EnvironmentOutlined />, label: 'Điểm tham quan' },
  { key: '/admin/content', icon: <AudioOutlined />, label: 'Nội dung thuyết minh' },
  { type: 'divider' },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất' },
];

/**
 * Khung Admin Dashboard (PRD 7.1.4, 7.1.5): thiết kế cho máy tính,
 * rộng tối thiểu 1024px, tiếng Việt, chỉ light mode (PRD 7.3).
 */
export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const admin = useAdminStore((state) => state.admin);
  const signOut = useAdminStore((state) => state.signOut);

  const selectedKey = location.pathname.startsWith('/admin/content')
    ? '/admin/content'
    : '/admin';

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      signOut();
      navigate('/admin/login', { replace: true });
      return;
    }

    navigate(key);
  };

  return (
    <Layout className="admin-shell" hasSider>
      <Sider width={240} theme="light" className="admin-sider">
        <div className="admin-brand">
          <span>Smart Tour Guide</span>
          <small>Bảng quản trị</small>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU_ITEMS}
          onClick={handleMenuClick}
        />

        <div className="admin-sider-footer">
          <Typography.Text type="secondary">
            Tài khoản: {admin?.username ?? 'admin'}
          </Typography.Text>
        </div>
      </Sider>

      <Layout className="admin-main">
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
