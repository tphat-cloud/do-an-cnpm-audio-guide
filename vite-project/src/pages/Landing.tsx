import { useState } from 'react';
import { Typography, Input, Row, Col, Card, Tag, Button, Space, Segmented } from 'antd';
import {
  SearchOutlined,
  CustomerServiceOutlined,
  EnvironmentOutlined,
  SoundOutlined,
  GlobalOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePlacesStore } from '../store/usePlacesStore';

const { Title, Paragraph, Text } = Typography;

function Landing() {
  const navigate = useNavigate();
  const places = usePlacesStore((state) => state.places);

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredPlaces = places.filter((place) => {
    const matchSearch =
      place.name.toLowerCase().includes(searchText.toLowerCase()) ||
      place.city.toLowerCase().includes(searchText.toLowerCase()) ||
      place.shortDesc.toLowerCase().includes(searchText.toLowerCase());

    const matchCategory =
      selectedCategory === 'all' || place.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  return (
    <div>
      {/* === HERO BANNER DU LỊCH === */}
      <div
        style={{
          background: 'linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#ffffff',
          padding: '70px 24px 80px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <Tag color="cyan" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 16, marginBottom: 16 }}>
            <SoundOutlined /> THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ BẰNG AI
          </Tag>

          <Title level={1} style={{ color: '#fff', fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
            Khám Phá Di Sản & Danh Thắng Việt Nam
          </Title>

          <Paragraph style={{ color: '#cbd5e1', fontSize: 18, marginBottom: 32 }}>
            Lắng nghe câu chuyện lịch sử, văn hóa được thuyết minh tự động qua giọng đọc truyền cảm bằng 5 ngôn ngữ: Tiếng Việt, Tiếng Anh, Tiếng Nhật, Tiếng Hàn, Tiếng Trung.
          </Paragraph>

          {/* Ô tìm kiếm nhanh */}
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <Input
              size="large"
              placeholder="Tìm tên địa danh hoặc thành phố (VD: Dinh Độc Lập, Hà Nội, Hội An...)"
              prefix={<SearchOutlined style={{ color: '#1677ff' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{
                borderRadius: 28,
                padding: '10px 20px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              }}
            />
          </div>
        </div>
      </div>

      {/* === BỘ LỌC THỂ LOẠI & DANH SÁCH ĐỊA DANH === */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 20px 0' }}>
        {/* Thanh filter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Điểm Đến & Di Tích Nổi Bật ({filteredPlaces.length})
            </Title>
            <Text type="secondary">Bấm vào bất kỳ địa danh nào để nghe bài thuyết minh tự động</Text>
          </div>

          <Segmented
            size="large"
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val as string)}
            options={[
              { label: '🌟 Tất cả', value: 'all' },
              { label: '🏛️ Di tích lịch sử', value: 'ditich' },
              { label: '🏞️ Thắng cảnh', value: 'thangcanh' },
              { label: '⛩️ Tôn giáo', value: 'tongiao' },
            ]}
          />
        </div>

        {/* Danh sách thẻ địa danh */}
        <Row gutter={[24, 24]}>
          {filteredPlaces.map((place) => (
            <Col xs={24} sm={12} lg={6} key={place.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                }}
                cover={
                  <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                    <img
                      alt={place.name}
                      src={place.imageUrl}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    <div style={{ position: 'absolute', top: 12, left: 12 }}>
                      <Tag color="blue" style={{ borderRadius: 6, fontWeight: 500 }}>
                        {place.categoryLabel}
                      </Tag>
                    </div>
                    <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                      <Tag color="black" style={{ borderRadius: 6, background: 'rgba(0,0,0,0.65)' }}>
                        <EnvironmentOutlined /> {place.city}
                      </Tag>
                    </div>
                  </div>
                }
                bodyStyle={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}
              >
                <Title level={4} style={{ marginBottom: 8, fontSize: 18 }}>
                  {place.name}
                </Title>

                <Paragraph
                  type="secondary"
                  ellipsis={{ rows: 2 }}
                  style={{ marginBottom: 14, flex: 1, fontSize: 13 }}
                >
                  {place.shortDesc}
                </Paragraph>

                {/* Danh sách cờ ngôn ngữ hỗ trợ */}
                <div style={{ marginBottom: 16, background: '#f1f5f9', padding: '6px 10px', borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GlobalOutlined /> Hỗ trợ giọng đọc:
                    <Space size={4}>
                      {place.narrations.map((n) => (
                        <span key={n.language} title={n.languageName} style={{ fontSize: 15 }}>
                          {n.flag}
                        </span>
                      ))}
                    </Space>
                  </Text>
                </div>

                {/* Nút nghe thuyết minh */}
                <Button
                  type="primary"
                  block
                  icon={<CustomerServiceOutlined />}
                  size="large"
                  style={{
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #1677ff 0%, #0284c7 100%)',
                    fontWeight: 600,
                  }}
                  onClick={() => navigate(`/places/${place.id}`)}
                >
                  Nghe Thuyết Minh <RightOutlined style={{ fontSize: 12 }} />
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}

export default Landing;
