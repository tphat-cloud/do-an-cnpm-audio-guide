import { Form, Input, Select, Button, Card, Typography, Upload, message, Space } from 'antd';
import { UploadOutlined, SoundOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

function CreateNarration() {
  const navigate = useNavigate();

  const languageOptions = [
    { value: 'vi', label: '🇻🇳 Tiếng Việt' },
    { value: 'en', label: '🇺🇸 Tiếng Anh' },
    { value: 'ja', label: '🇯🇵 Tiếng Nhật' },
    { value: 'ko', label: '🇰🇷 Tiếng Hàn' },
    { value: 'zh', label: '🇨🇳 Tiếng Trung' },
  ];

  const onFinish = (values: { title: string; content: string; sourceLanguage: string; targetLanguages: string[] }) => {
    console.log('Create narration:', values);
    // TODO: Gọi API tạo thuyết minh ở đây
    message.success('Đã gửi yêu cầu tạo thuyết minh! Hệ thống đang xử lý...');
    navigate('/dashboard');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={3}>
        <SoundOutlined style={{ marginRight: 8 }} />
        Tạo Thuyết Minh Mới
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Nhập nội dung bạn muốn thuyết minh, chọn ngôn ngữ đích, hệ thống sẽ tự động dịch và tạo giọng nói.
      </Text>

      <Card>
        <Form
          layout="vertical"
          size="large"
          onFinish={onFinish}
        >
          {/* Tiêu đề */}
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="VD: Giới thiệu công ty ABC" />
          </Form.Item>

          {/* Nội dung */}
          <Form.Item
            label="Nội dung thuyết minh"
            name="content"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
          >
            <TextArea
              rows={8}
              placeholder="Nhập nội dung văn bản bạn muốn chuyển thành thuyết minh..."
              showCount
              maxLength={5000}
            />
          </Form.Item>

          {/* Upload file (tùy chọn) */}
          <Form.Item label="Hoặc upload file văn bản (tùy chọn)">
            <Upload
              accept=".txt,.doc,.docx,.pdf"
              maxCount={1}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Chọn file (.txt, .doc, .pdf)</Button>
            </Upload>
          </Form.Item>

          {/* Ngôn ngữ gốc */}
          <Form.Item
            label="Ngôn ngữ gốc"
            name="sourceLanguage"
            rules={[{ required: true, message: 'Vui lòng chọn ngôn ngữ gốc!' }]}
            initialValue="vi"
          >
            <Select options={languageOptions} />
          </Form.Item>

          {/* Ngôn ngữ đích */}
          <Form.Item
            label="Dịch sang ngôn ngữ"
            name="targetLanguages"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ngôn ngữ đích!' }]}
          >
            <Select
              mode="multiple"
              options={languageOptions}
              placeholder="Chọn ngôn ngữ muốn dịch sang (có thể chọn nhiều)"
            />
          </Form.Item>

          {/* Nút gửi */}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                Tạo Thuyết Minh
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default CreateNarration;
