import { Table, Button, Tag, Space, Typography, Input } from 'antd';
import {
  PlusCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

function Dashboard() {
  const navigate = useNavigate();

  // Dữ liệu mẫu (sau này sẽ lấy từ API)
  const dataSource = [
    {
      key: '1',
      title: 'Giới thiệu công ty ABC',
      sourceLanguage: 'Tiếng Việt',
      targetLanguages: ['EN', 'JP'],
      status: 'completed',
      createdAt: '2026-10-17 10:30',
    },
    {
      key: '2',
      title: 'Bài thuyết trình sản phẩm mới',
      sourceLanguage: 'Tiếng Việt',
      targetLanguages: ['EN', 'KR', 'ZH'],
      status: 'processing',
      createdAt: '2026-10-17 09:15',
    },
    {
      key: '3',
      title: 'Hướng dẫn sử dụng phần mềm',
      sourceLanguage: 'Tiếng Anh',
      targetLanguages: ['VI'],
      status: 'failed',
      createdAt: '2026-10-16 14:00',
    },
  ];

  const statusMap: Record<string, { color: string; text: string }> = {
    completed: { color: 'green', text: 'Hoàn thành' },
    processing: { color: 'blue', text: 'Đang xử lý' },
    failed: { color: 'red', text: 'Thất bại' },
    pending: { color: 'orange', text: 'Chờ xử lý' },
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Ngôn ngữ gốc',
      dataIndex: 'sourceLanguage',
      key: 'sourceLanguage',
    },
    {
      title: 'Ngôn ngữ đích',
      dataIndex: 'targetLanguages',
      key: 'targetLanguages',
      render: (langs: string[]) => (
        <Space>
          {langs.map((lang) => (
            <Tag color="blue" key={lang}>{lang}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: { key: string }) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/narration/${record.key}`)}
          >
            Xem
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <SoundOutlined style={{ marginRight: 8 }} />
          Danh Sách Thuyết Minh
        </Title>
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          size="large"
          onClick={() => navigate('/create')}
        >
          Tạo Thuyết Minh Mới
        </Button>
      </div>

      {/* Thanh tìm kiếm */}
      <Input
        placeholder="Tìm kiếm bài thuyết minh..."
        prefix={<SearchOutlined />}
        style={{ marginBottom: 16, maxWidth: 400 }}
        size="large"
      />

      {/* Bảng danh sách */}
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

export default Dashboard;
