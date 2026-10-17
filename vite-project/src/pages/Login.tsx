import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { LockOutlined, MailOutlined, SoundOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const { Title, Text } = Typography;

function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const onFinish = (values: { email: string; password: string }) => {
    // Giả lập đăng nhập: nếu email có chữ "admin" thì cấp quyền admin
    const isAdmin = values.email.toLowerCase().includes('admin');

    login({
      id: isAdmin ? 'admin-1' : 'user-1',
      email: values.email,
      fullName: isAdmin ? 'Ban Quản Lý Di Tích' : 'Nguyễn Văn Du Khách',
      role: isAdmin ? 'admin' : 'user',
    });

    message.success(`Đăng nhập thành công với vai trò: ${isAdmin ? 'Quản Trị Viên (Admin)' : 'Khách Du Lịch'}`);
    if (isAdmin) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  // Nút đăng nhập demo nhanh 1 chạm (rất tiện khi đi chấm đồ án)
  const handleQuickLogin = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      login({
        id: 'admin-1',
        email: 'admin@audioguide.vn',
        fullName: 'Trưởng Ban Quản Lý Di Tích',
        role: 'admin',
      });
      message.success('Đã đăng nhập với tài khoản Quản Trị Viên (Admin)');
      navigate('/admin');
    } else {
      login({
        id: 'tourist-1',
        email: 'tourist@gmail.com',
        fullName: 'Trần Minh Khang (Du Khách)',
        role: 'user',
      });
      message.success('Đã đăng nhập với tài khoản Khách Du Lịch');
      navigate('/');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 440,
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          borderRadius: 16,
        }}
      >
        {/* Nút quay lại */}
        <Button
          type="text"
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
          style={{ marginBottom: 12 }}
        >
          Trang chủ
        </Button>

        {/* Header logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #1677ff 0%, #00b96b 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 26,
              marginBottom: 12,
            }}
          >
            <SoundOutlined />
          </div>
          <Title level={3} style={{ margin: 0 }}>
            VN Audio Guide
          </Title>
          <Text type="secondary">Đăng nhập hệ thống Thuyết minh Du lịch</Text>
        </div>

        {/* Form đăng nhập */}
        <Form
          name="login"
          size="large"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email đăng nhập" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ borderRadius: 8 }}>
              Đăng Nhập
            </Button>
          </Form.Item>
        </Form>

        {/* Nút đăng nhập nhanh test đồ án */}
        <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 16 }}>
          <Text strong style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 8 }}>
            ⚡ Đăng nhập nhanh để test phân quyền (Đồ án):
          </Text>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              block
              size="middle"
              onClick={() => handleQuickLogin('admin')}
              style={{ background: '#e0f2fe', borderColor: '#7dd3fc', color: '#0369a1', fontWeight: 600 }}
            >
              🛡️ Đăng nhập quyền Admin (Ban Quản Lý)
            </Button>
            <Button
              block
              size="middle"
              onClick={() => handleQuickLogin('user')}
              style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#15803d', fontWeight: 600 }}
            >
              👤 Đăng nhập quyền Khách Du Lịch
            </Button>
          </Space>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Text>Chưa có tài khoản? </Text>
          <Link to="/register">Đăng ký thành viên</Link>
        </div>
      </Card>
    </div>
  );
}

export default Login;
