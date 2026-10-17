import { Table, Button, Tag, Space, Typography, Card, Row, Col, Popconfirm, message } from 'antd';
import {
  PlusCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  SoundOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePlacesStore } from '../store/usePlacesStore';

const { Title, Text } = Typography;

function AdminDashboard() {
  const navigate = useNavigate();
  const places = usePlacesStore((state) => state.places);
  const deletePlace = usePlacesStore((state) => state.deletePlace);

  const totalListens = places.reduce((sum, p) => sum + p.totalListens, 0);

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (url: string, record: { name: string }) => (
        <img
          src={url}
          alt={record.name}
          style={{ width: 70, height: 50, objectFit: 'cover', borderRadius: 6 }}
        />
      ),
    },
    {
      title: 'Tên địa danh',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: { id: string }) => (
        <div>
          <strong style={{ fontSize: 14 }}>{text}</strong>
          <div style={{ fontSize: 12, color: '#64748b' }}>Mã: {record.id}</div>
        </div>
      ),
    },
    {
      title: 'Thành phố',
      dataIndex: 'city',
      key: 'city',
      render: (city: string) => <Tag color="blue">{city}</Tag>,
    },
    {
      title: 'Phân loại',
      dataIndex: 'categoryLabel',
      key: 'categoryLabel',
    },
    {
      title: 'Audio Guide (Ngôn ngữ đã dịch & tạo âm thanh)',
      key: 'narrations',
      render: (_: unknown, record: { narrations: { language: string; flag: string }[] }) => (
        <Space size={4}>
          {record.narrations.map((n) => (
            <Tag key={n.language} color="cyan">
              {n.flag} {n.language.toUpperCase()}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Lượt nghe',
      dataIndex: 'totalListens',
      key: 'totalListens',
      render: (val: number) => (
        <span style={{ fontWeight: 600, color: '#1677ff' }}>
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: { id: string }) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/places/${record.id}`)}
          >
            Xem như khách
          </Button>

          <Popconfirm
            title="Xóa địa danh này?"
            description="Bạn có chắc muốn xóa điểm tham quan này không?"
            onConfirm={() => {
              deletePlace(record.id);
              message.success('Đã xóa địa danh!');
            }}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header & Thống kê */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Quản Lý Điểm Du Lịch & Thuyết Minh Tự Động
          </Title>
          <Text type="secondary">
            Ban Quản lý có thể thêm di tích mới, hệ thống Microservices sẽ tự động dịch và sinh giọng nói Audio Guide
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          size="large"
          style={{ borderRadius: 8 }}
          onClick={() => navigate('/admin/create')}
        >
          Thêm Địa Danh Mới
        </Button>
      </div>

      {/* 3 Thẻ thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: '#e6f4ff', color: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <EnvironmentOutlined />
              </div>
              <div>
                <Text type="secondary">Tổng số Địa danh</Text>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{places.length} điểm</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: '#f6ffed', color: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <CustomerServiceOutlined />
              </div>
              <div>
                <Text type="secondary">Tổng lượt khách đã nghe</Text>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>{totalListens.toLocaleString()} lượt</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: '#fff7e6', color: '#fa8c16', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                <GlobalOutlined />
              </div>
              <div>
                <Text type="secondary">Ngôn ngữ hỗ trợ AI</Text>
                <div style={{ fontSize: 24, fontWeight: 'bold' }}>5 Ngôn ngữ</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bảng danh sách */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SoundOutlined style={{ color: '#1677ff' }} />
            <span>Danh Sách Di Tích & Danh Thắng ({places.length})</span>
          </div>
        }
      >
        <Table
          dataSource={places}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
}

export default AdminDashboard;
