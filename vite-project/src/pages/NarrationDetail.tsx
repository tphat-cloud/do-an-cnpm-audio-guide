import { Card, Typography, Tag, Tabs, Button, Descriptions, Progress } from 'antd';
import {
  SoundOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Paragraph } = Typography;

function NarrationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Dữ liệu mẫu (sau này lấy từ API theo id)
  const narration = {
    id: id,
    title: 'Giới thiệu công ty ABC',
    originalContent:
      'Công ty ABC được thành lập năm 2020, chuyên cung cấp các giải pháp công nghệ cho doanh nghiệp. Với đội ngũ hơn 50 nhân viên giàu kinh nghiệm, chúng tôi cam kết mang đến những sản phẩm chất lượng cao nhất.',
    sourceLanguage: 'Tiếng Việt',
    status: 'completed',
    createdAt: '2026-10-17 10:30',
    translations: [
      {
        language: 'EN',
        languageName: 'Tiếng Anh',
        translatedContent:
          'ABC Company was established in 2020, specializing in providing technology solutions for businesses. With a team of over 50 experienced employees, we are committed to delivering the highest quality products.',
        audioUrl: '#',
        status: 'completed',
      },
      {
        language: 'JP',
        languageName: 'Tiếng Nhật',
        translatedContent:
          'ABC会社は2020年に設立され、企業向けのテクノロジーソリューションを提供することを専門としています。50人以上の経験豊富な従業員からなるチームで、最高品質の製品を提供することをお約束します。',
        audioUrl: '#',
        status: 'completed',
      },
    ],
  };

  const tabItems = narration.translations.map((t) => ({
    key: t.language,
    label: `${t.language} - ${t.languageName}`,
    children: (
      <div>
        {/* Nội dung đã dịch */}
        <Card style={{ marginBottom: 16 }}>
          <Title level={5}>Nội dung đã dịch</Title>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
            {t.translatedContent}
          </Paragraph>
        </Card>

        {/* Audio player */}
        <Card>
          <Title level={5}>
            <SoundOutlined style={{ marginRight: 8 }} />
            Nghe Thuyết Minh
          </Title>
          {t.status === 'completed' ? (
            <div>
              <audio controls style={{ width: '100%', marginBottom: 16 }}>
                <source src={t.audioUrl} type="audio/mpeg" />
                Trình duyệt không hỗ trợ audio.
              </audio>
              <Button icon={<DownloadOutlined />} type="primary">
                Tải xuống MP3
              </Button>
            </div>
          ) : (
            <div>
              <Paragraph>Đang tạo audio...</Paragraph>
              <Progress percent={60} status="active" />
            </div>
          )}
        </Card>
      </div>
    ),
  }));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Nút quay lại */}
      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/dashboard')}
      >
        Quay lại
      </Button>

      {/* Thông tin chung */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={3}>{narration.title}</Title>
        <Descriptions column={2}>
          <Descriptions.Item label="Trạng thái">
            <Tag color="green">Hoàn thành</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{narration.createdAt}</Descriptions.Item>
          <Descriptions.Item label="Ngôn ngữ gốc">{narration.sourceLanguage}</Descriptions.Item>
          <Descriptions.Item label="Số bản dịch">{narration.translations.length}</Descriptions.Item>
        </Descriptions>

        <Title level={5} style={{ marginTop: 16 }}>Nội dung gốc</Title>
        <Paragraph style={{ fontSize: 15, background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          {narration.originalContent}
        </Paragraph>
      </Card>

      {/* Tabs các bản dịch */}
      <Card>
        <Title level={4}>Các Bản Dịch & Audio</Title>
        <Tabs items={tabItems} />
      </Card>
    </div>
  );
}

export default NarrationDetail;
