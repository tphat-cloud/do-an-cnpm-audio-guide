import { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  Space,
  Checkbox,
  Modal,
  Steps,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePlacesStore } from '../store/usePlacesStore';
import type { TouristPlace, NarrationItem } from '../types/place';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function AdminCreatePlace() {
  const navigate = useNavigate();
  const addPlace = usePlacesStore((state) => state.addPlace);

  const [form] = Form.useForm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Xử lý gửi form
  const handleFinish = (values: {
    name: string;
    city: string;
    category: 'ditich' | 'thangcanh' | 'baotang' | 'tongiao';
    imageUrl: string;
    openingHours: string;
    ticketPrice: string;
    shortDesc: string;
    vietnameseNarration: string;
    targetLanguages: string[];
  }) => {
    setIsProcessing(true);
    setCurrentStep(0); // Bước 1: Lưu vào DB

    // Giả lập tiến trình các Microservices hoạt động tuần tự
    setTimeout(() => {
      setCurrentStep(1); // Bước 2: Translation Service dịch thuật

      setTimeout(() => {
        setCurrentStep(2); // Bước 3: TTS Service tạo file âm thanh

        setTimeout(() => {
          setCurrentStep(3); // Bước 4: Hoàn tất

          // Danh mục label
          const categoryLabels: Record<string, string> = {
            ditich: 'Di tích lịch sử',
            thangcanh: 'Danh lam thắng cảnh',
            baotang: 'Bảo tàng',
            tongiao: 'Văn hóa - Tôn giáo',
          };

          // Tạo danh sách bản thuyết minh đa ngôn ngữ
          const narrations: NarrationItem[] = [
            {
              language: 'vi',
              languageName: 'Tiếng Việt',
              flag: '🇻🇳',
              voiceName: 'Giọng Nam miền Nam (Truyền cảm)',
              audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
              title: `Thuyết minh ${values.name}`,
              narrationText: values.vietnameseNarration,
            },
          ];

          if (values.targetLanguages.includes('en')) {
            narrations.push({
              language: 'en',
              languageName: 'English',
              flag: '🇬🇧',
              voiceName: 'English (US - Natural Studio)',
              audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
              title: `${values.name} Audio Tour`,
              narrationText: `[Auto-Translated] Welcome to ${values.name} in ${values.city}. ${values.shortDesc}. Let us explore the rich culture and deep historical roots of this magnificent destination.`,
            });
          }

          if (values.targetLanguages.includes('ja')) {
            narrations.push({
              language: 'ja',
              languageName: '日本語',
              flag: '🇯🇵',
              voiceName: 'Japanese (Polite Female)',
              audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
              title: `${values.name} 音声ガイド`,
              narrationText: `[自動翻訳] ${values.city}にある${values.name}へようこそ。歴史と文化の息吹を感じられる素晴らしい観光名所です。`,
            });
          }

          if (values.targetLanguages.includes('ko')) {
            narrations.push({
              language: 'ko',
              languageName: '한국어',
              flag: '🇰🇷',
              voiceName: 'Korean (Clear Male)',
              audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
              title: `${values.name} 오디오 가이드`,
              narrationText: `[자동 번역] ${values.city}의 명소인 ${values.name}에 오신 것을 환영합니다. 베트남의 아름다운 문화와 역사를 만나보세요.`,
            });
          }

          if (values.targetLanguages.includes('zh')) {
            narrations.push({
              language: 'zh',
              languageName: '中文',
              flag: '🇨🇳',
              voiceName: 'Mandarin (Standard)',
              audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
              title: `${values.name} 语音导览`,
              narrationText: `[自动翻译] 欢迎来到位于${values.city}的${values.name}。这里拥有深厚的历史文化底蕴，是越南著名的旅游胜地。`,
            });
          }

          const idSlug = values.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');

          const newPlace: TouristPlace = {
            id: idSlug || `place-${Date.now()}`,
            name: values.name,
            category: values.category,
            categoryLabel: categoryLabels[values.category] || 'Điểm tham quan',
            city: values.city,
            imageUrl:
              values.imageUrl ||
              'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80',
            shortDesc: values.shortDesc,
            historyText: values.vietnameseNarration,
            openingHours: values.openingHours || '08:00 - 17:00 hàng ngày',
            ticketPrice: values.ticketPrice || 'Miễn phí',
            totalListens: 0,
            narrations: narrations,
          };

          addPlace(newPlace);
          message.success('Đã thêm địa danh và tạo thuyết minh tự động thành công!');
          setIsProcessing(false);
          navigate(`/places/${newPlace.id}`);
        }, 1200);
      }, 1400);
    }, 1200);
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/admin')}
      >
        Quay lại danh sách
      </Button>

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <SoundOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          Thêm Điểm Du Lịch & Tạo Audio Guide Tự Động
        </Title>
        <Text type="secondary">
          Bạn chỉ cần nhập nội dung tiếng Việt. Hệ thống Microservices sẽ tự động kích hoạt dịch sang các thứ tiếng và sinh giọng đọc Audio Guide.
        </Text>
      </div>

      <Card style={{ borderRadius: 16, boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={handleFinish}
          initialValues={{
            category: 'ditich',
            openingHours: '08:00 - 17:00',
            ticketPrice: '40.000 VNĐ',
            targetLanguages: ['en', 'ja', 'ko', 'zh'],
          }}
        >
          {/* Tên địa danh & Thành phố */}
          <Space direction="horizontal" style={{ width: '100%' }} size="large">
            <Form.Item
              label="Tên điểm tham quan / di tích"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên địa danh!' }]}
              style={{ flex: 2 }}
            >
              <Input placeholder="VD: Bảo Tàng Chứng Tích Chiến Tranh" />
            </Form.Item>

            <Form.Item
              label="Tỉnh / Thành phố"
              name="city"
              rules={[{ required: true, message: 'Vui lòng nhập thành phố!' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="VD: TP. Hồ Chí Minh" />
            </Form.Item>
          </Space>

          {/* Phân loại & Ảnh */}
          <Space direction="horizontal" style={{ width: '100%' }} size="large">
            <Form.Item
              label="Phân loại"
              name="category"
              style={{ flex: 1 }}
            >
              <Select
                options={[
                  { label: '🏛️ Di tích lịch sử', value: 'ditich' },
                  { label: '🏞️ Danh lam thắng cảnh', value: 'thangcanh' },
                  { label: '🖼️ Bảo tàng', value: 'baotang' },
                  { label: '⛩️ Văn hóa - Tôn giáo', value: 'tongiao' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Link hình ảnh đại diện (URL)"
              name="imageUrl"
              style={{ flex: 2 }}
            >
              <Input placeholder="https://images.unsplash.com/..." />
            </Form.Item>
          </Space>

          {/* Giờ mở cửa & Giá vé */}
          <Space direction="horizontal" style={{ width: '100%' }} size="large">
            <Form.Item label="Giờ mở cửa" name="openingHours" style={{ flex: 1 }}>
              <Input placeholder="08:00 - 17:00 hàng ngày" />
            </Form.Item>

            <Form.Item label="Giá vé tham quan" name="ticketPrice" style={{ flex: 1 }}>
              <Input placeholder="VD: 40.000 VNĐ hoặc Miễn phí" />
            </Form.Item>
          </Space>

          {/* Mô tả ngắn */}
          <Form.Item
            label="Mô tả tóm tắt (1-2 câu)"
            name="shortDesc"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả ngắn!' }]}
          >
            <Input placeholder="VD: Nơi lưu giữ những hình ảnh, tư liệu chân thực về lịch sử chiến tranh tại Việt Nam." />
          </Form.Item>

          {/* Lời thuyết minh gốc tiếng Việt */}
          <Form.Item
            label="Lời bình thuyết minh gốc (Tiếng Việt)"
            name="vietnameseNarration"
            rules={[{ required: true, message: 'Vui lòng nhập lời thuyết minh!' }]}
            extra="Đoạn văn này sẽ được dùng làm dữ liệu đầu vào để AI tự động dịch và đọc giọng nói."
          >
            <TextArea
              rows={5}
              placeholder="Kính chào quý khách đến với... Nơi đây được thành lập vào năm... mang ý nghĩa to lớn..."
              showCount
              maxLength={3000}
            />
          </Form.Item>

          {/* HỘP CẤU HÌNH MICROSERVICES TỰ ĐỘNG */}
          <Card
            style={{
              background: '#f0f9ff',
              borderColor: '#bae6fd',
              marginBottom: 24,
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ThunderboltOutlined style={{ color: '#0284c7', fontSize: 18 }} />
              <strong style={{ color: '#0369a1', fontSize: 15 }}>
                Tự Động Kích Hoạt AI Microservices:
              </strong>
            </div>

            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 12 }}>
              Hệ thống sẽ tự động gửi nội dung trên sang <strong>Translation Service</strong> để dịch và <strong>TTS Service</strong> để tạo file giọng nói MP3 tương ứng.
            </Paragraph>

            <Form.Item
              name="targetLanguages"
              label="Chọn các ngôn ngữ muốn tự động tạo Audio Guide:"
              style={{ marginBottom: 0 }}
            >
              <Checkbox.Group
                options={[
                  { label: '🇬🇧 English (Tiếng Anh)', value: 'en' },
                  { label: '🇯🇵 日本語 (Tiếng Nhật)', value: 'ja' },
                  { label: '🇰🇷 한국어 (Tiếng Hàn)', value: 'ko' },
                  { label: '🇨🇳 中文 (Tiếng Trung)', value: 'zh' },
                ]}
              />
            </Form.Item>
          </Card>

          {/* Nút Submit */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<ThunderboltOutlined />}
              style={{
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1677ff 0%, #0284c7 100%)',
                fontWeight: 600,
                height: 48,
                padding: '0 32px',
              }}
            >
              Lưu Địa Danh & Tự Động Tạo Thuyết Minh
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* MODAL MÔ PHỎNG QUÁ TRÌNH MICROSERVICES XỬ LÝ */}
      <Modal
        open={isProcessing}
        footer={null}
        closable={false}
        centered
        width={560}
      >
        <div style={{ textAlign: 'center', padding: '24px 0 12px' }}>
          <Title level={4} style={{ marginBottom: 6 }}>
            ⚙️ Đang Kích Hoạt Pipeline Microservices...
          </Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 28 }}>
            Hệ thống đang lưu trữ, dịch thuật và sinh giọng nói Audio Guide
          </Text>

          <Steps
            direction="vertical"
            current={currentStep}
            items={[
              {
                title: 'Content Service',
                description: 'Lưu thông tin địa danh & nội dung gốc vào MySQL Database',
              },
              {
                title: 'Translation Service (AI)',
                description: 'Đang dịch lời thuyết minh sang 4 ngôn ngữ (EN, JA, KO, ZH)',
              },
              {
                title: 'Text-to-Speech Service (TTS)',
                description: 'Đang tổng hợp giọng nói & xuất file âm thanh Audio Guide',
              },
              {
                title: 'Hoàn tất & Xuất bản',
                description: 'Khách du lịch đã có thể nghe thuyết minh trực tiếp!',
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

export default AdminCreatePlace;
