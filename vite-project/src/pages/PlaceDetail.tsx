import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Radio,
  Divider,
  Descriptions,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  SoundOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CustomerServiceOutlined,
  BookOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { usePlacesStore } from '../store/usePlacesStore';

const { Title, Paragraph, Text } = Typography;

function PlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const places = usePlacesStore((state) => state.places);
  const incrementListens = usePlacesStore((state) => state.incrementListens);

  const place = places.find((p) => p.id === id);

  // Chọn ngôn ngữ đang nghe (mặc định là tiếng đầu tiên, thường là tiếng Việt)
  const [selectedLang, setSelectedLang] = useState<string>('vi');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (id) {
      incrementListens(id);
    }
  }, [id, incrementListens]);

  // Điều chỉnh tốc độ phát âm thanh khi thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  if (!place) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Title level={3}>Không tìm thấy địa danh này!</Title>
        <Button type="primary" onClick={() => navigate('/')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Lấy bài thuyết minh của ngôn ngữ đang chọn
  const activeNarration =
    place.narrations.find((n) => n.language === selectedLang) || place.narrations[0];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      {/* Nút quay lại */}
      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 20 }}
        onClick={() => navigate('/')}
      >
        Khám phá địa danh khác
      </Button>

      {/* === BANNER & THÔNG TIN ĐỊA DANH === */}
      <Card
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 28,
          boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ position: 'relative', height: 340, width: '100%' }}>
          <img
            src={place.imageUrl}
            alt={place.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 60%)',
            }}
          />
          <div style={{ position: 'absolute', bottom: 24, left: 28, right: 28, color: '#fff' }}>
            <Space size={8} style={{ marginBottom: 8 }}>
              <Tag color="blue">{place.categoryLabel}</Tag>
              <Tag color="cyan">
                <EnvironmentOutlined /> {place.city}
              </Tag>
              <Tag color="gold">
                <CustomerServiceOutlined /> {place.totalListens.toLocaleString()} lượt nghe
              </Tag>
            </Space>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              {place.name}
            </Title>
            <Text style={{ color: '#e2e8f0', fontSize: 16 }}>{place.shortDesc}</Text>
          </div>
        </div>

        {/* Thông tin tham quan nhanh */}
        <div style={{ padding: '16px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Row gutter={[24, 12]}>
            <Col xs={24} sm={12}>
              <Text type="secondary">
                <ClockCircleOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                <strong>Giờ mở cửa:</strong> {place.openingHours}
              </Text>
            </Col>
            <Col xs={24} sm={12}>
              <Text type="secondary">
                <DollarOutlined style={{ marginRight: 6, color: '#52c41a' }} />
                <strong>Vé tham quan:</strong> {place.ticketPrice}
              </Text>
            </Col>
          </Row>
        </div>
      </Card>

      {/* === TRÌNH PHÁT THUYẾT MINH DU LỊCH ĐA NGÔN NGỮ (CORE FEATURE) === */}
      <Card
        style={{
          borderRadius: 20,
          marginBottom: 28,
          border: '2px solid #93c5fd',
          boxShadow: '0 8px 24px rgba(22, 119, 255, 0.12)',
          background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              <SoundOutlined style={{ color: '#1677ff', marginRight: 10 }} />
              Audio Guide - Thuyết Minh Tự Động
            </Title>
            <Text type="secondary">Chọn thứ tiếng của bạn để nghe lời thuyết minh về địa danh này</Text>
          </div>

          <Tag color="green" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 8 }}>
            🎙️ AI Voice Active
          </Tag>
        </div>

        {/* BỘ CHỌN NGÔN NGỮ (FLAGS) */}
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 10 }}>
            Ngôn ngữ thuyết minh:
          </Text>
          <Radio.Group
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            size="large"
            buttonStyle="solid"
          >
            {place.narrations.map((n) => (
              <Radio.Button key={n.language} value={n.language} style={{ marginRight: 8, borderRadius: 8 }}>
                <span style={{ fontSize: 18, marginRight: 6 }}>{n.flag}</span>
                {n.languageName}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>

        {/* THÔNG TIN GIỌNG ĐỌC & ĐIỀU KHIỂN ÂM THANH */}
        <div
          style={{
            background: '#ffffff',
            padding: 20,
            borderRadius: 14,
            border: '1px solid #bfdbfe',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div>
              <Text strong style={{ fontSize: 16, color: '#1e40af' }}>
                {activeNarration.title}
              </Text>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Giọng đọc: {activeNarration.voiceName}
              </div>
            </div>

            {/* Chọn tốc độ đọc */}
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>Tốc độ đọc:</Text>
              <Radio.Group
                size="small"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(e.target.value)}
              >
                <Radio.Button value={0.75}>0.75x</Radio.Button>
                <Radio.Button value={1}>1.0x</Radio.Button>
                <Radio.Button value={1.25}>1.25x</Radio.Button>
                <Radio.Button value={1.5}>1.5x</Radio.Button>
              </Radio.Group>
            </Space>
          </div>

          {/* HTML5 Audio Player */}
          <audio
            ref={audioRef}
            key={activeNarration.language} // reload player khi đổi tiếng
            controls
            style={{ width: '100%', marginBottom: 12 }}
          >
            <source src={activeNarration.audioUrl} type="audio/ogg" />
            Trình duyệt không hỗ trợ audio tag.
          </audio>

          <Button
            icon={<DownloadOutlined />}
            size="small"
            type="dashed"
            onClick={() => message.info('Tải xuống file MP3 bản thuyết minh thành công!')}
          >
            Tải file âm thanh ({activeNarration.language.toUpperCase()})
          </Button>
        </div>

        {/* LỜI BÌNH THUYẾT MINH HIỂN THỊ DƯỚI DẠNG CHỮ */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8, color: '#334155' }}>
            📜 Bản chép lời thuyết minh ({activeNarration.languageName}):
          </Text>
          <div
            style={{
              background: '#ffffff',
              padding: 20,
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              fontSize: 16,
              lineHeight: 1.8,
              color: '#1e293b',
            }}
          >
            {activeNarration.narrationText}
          </div>
        </div>
      </Card>

      {/* === LỊCH SỬ & GIỚI THIỆU CHI TIẾT === */}
      <Card
        style={{
          borderRadius: 20,
          boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
        }}
      >
        <Title level={4}>
          <BookOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          Lịch Sử & Ý Nghĩa Văn Hóa
        </Title>
        <Divider style={{ margin: '12px 0 20px' }} />
        <Paragraph style={{ fontSize: 16, lineHeight: 1.9, color: '#334155' }}>
          {place.historyText}
        </Paragraph>

        <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginTop: 24 }}>
          <Descriptions.Item label="Tên di tích / Thắng cảnh">{place.name}</Descriptions.Item>
          <Descriptions.Item label="Địa phương">{place.city}</Descriptions.Item>
          <Descriptions.Item label="Phân loại">{place.categoryLabel}</Descriptions.Item>
          <Descriptions.Item label="Số ngôn ngữ hỗ trợ">{place.narrations.length} thứ tiếng</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

export default PlaceDetail;
