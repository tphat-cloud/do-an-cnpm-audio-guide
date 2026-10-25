import { useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { loginAdmin, readApiError } from '../../api/admin';
import { isAdminTokenUsable } from '../../api/adminToken';
import { useAdminStore } from '../../store/useAdminStore';

interface LoginFormValues {
  username: string;
  password: string;
}

/** "còn khoảng N phút" cho thông báo khóa tài khoản (API01 - 429). */
function describeRetryAfter(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return '';
  return ` (còn khoảng ${Math.ceil(seconds / 60)} phút)`;
}

/**
 * Trang đăng nhập Admin (PRD 7.1.3 - UC07): thẻ giữa màn hình, chỉ light mode,
 * báo đúng từng trạng thái lỗi và lưu JWT vào localStorage khi thành công.
 */
export function AdminLoginPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signIn = useAdminStore((state) => state.signIn);
  const token = useAdminStore((state) => state.token);

  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const showExpiredNotice = searchParams.get('expired') === '1';

  // Còn phiên hợp lệ thì vào thẳng trang quản lý điểm tham quan.
  if (isAdminTokenUsable(token)) {
    return <Navigate to="/admin" replace />;
  }

  const handleFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    setErrorText('');

    try {
      const data = await loginAdmin(values.username.trim(), values.password);
      signIn(data.token, data.admin);
      message.success('Đăng nhập thành công');
      navigate('/admin', { replace: true });
    } catch (error) {
      const parsed = readApiError(error);

      if (parsed.status === 401) {
        // Báo chung, không nói rõ sai ô nào (PRD 3.3.7 - 5a).
        setErrorText('Sai tên đăng nhập hoặc mật khẩu');
      } else if (parsed.status === 429) {
        setErrorText(`${parsed.message}${describeRetryAfter(parsed.retryAfterSeconds)}`);
      } else if (parsed.status === 400) {
        setErrorText(parsed.message);
      } else {
        setErrorText('Không kết nối được máy chủ');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <Card className="admin-login-card" variant="outlined">
        <Typography.Title level={3} className="admin-login-title">
          Quản trị Smart Tour Guide
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Đăng nhập để quản lý điểm tham quan và nội dung thuyết minh.
        </Typography.Paragraph>

        {showExpiredNotice && (
          <Alert
            className="admin-login-alert"
            type="warning"
            showIcon
            title="Phiên đăng nhập đã hết hạn"
          />
        )}

        {errorText !== '' && (
          <Alert
            className="admin-login-alert"
            type="error"
            showIcon
            title={errorText}
          />
        )}

        <Form<LoginFormValues>
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
          disabled={submitting}
        >
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập đầy đủ' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="admin"
              size="large"
              autoComplete="username"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập đầy đủ' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={submitting}
            disabled={submitting}
          >
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}
