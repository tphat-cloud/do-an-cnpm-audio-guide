import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Card,
  Empty,
  Popconfirm,
  Result,
  Space,
  Spin,
  Statistic,
  Table,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { EnvironmentOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import {
  deletePoi,
  fetchAdminLocation,
  fetchPresence,
  readApiError,
} from '../../api/admin';
import type { PresenceStats } from '../../api/admin';
import { readHttpStatus } from '../../api/client';
import type { PoiSummary } from '../../types';
import { PoiFormModal } from './PoiFormModal';

type LoadStatus = 'loading' | 'ready' | 'error';

/** Chu kỳ làm mới số liệu truy cập (API11). */
const PRESENCE_POLL_MS = 10_000;

/**
 * Các cột dữ liệu của bảng danh sách điểm (PRD 7.1.4 - UC08). Cột "Thao tác"
 * cần gọi API nên được ghép thêm trong component.
 */
const DATA_COLUMNS: TableColumnsType<PoiSummary> = [
  { title: 'Tên', dataIndex: 'name', key: 'name', ellipsis: true },
  {
    title: 'Vĩ độ',
    dataIndex: 'latitude',
    key: 'latitude',
    width: 150,
    render: (value: number) => value.toFixed(7),
  },
  {
    title: 'Kinh độ',
    dataIndex: 'longitude',
    key: 'longitude',
    width: 150,
    render: (value: number) => value.toFixed(7),
  },
  {
    title: 'Bán kính (m)',
    dataIndex: 'radiusM',
    key: 'radiusM',
    width: 130,
    align: 'right',
  },
  {
    title: 'Thứ tự',
    dataIndex: 'orderIndex',
    key: 'orderIndex',
    width: 100,
    align: 'right',
  },
];

export function AdminPoiPage() {
  const { message } = App.useApp();
  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [presence, setPresence] = useState<PresenceStats | null>(null);
  const [presenceStale, setPresenceStale] = useState(false);
  // Điểm đang sửa (null: hộp thoại ở chế độ thêm mới) và điểm đang xóa.
  const [formTarget, setFormTarget] = useState<PoiSummary | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    fetchAdminLocation()
      .then((location) => {
        if (!active) return;
        setPois(location.pois);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  // Số liệu truy cập (API11) tự làm mới mỗi 10 giây; lỗi thì giữ số cũ.
  useEffect(() => {
    let active = true;

    const loadPresence = () => {
      fetchPresence()
        .then((stats) => {
          if (!active) return;
          setPresence(stats);
          setPresenceStale(false);
        })
        .catch(() => {
          if (!active) return;
          setPresenceStale(true);
        });
    };

    loadPresence();
    const timer = window.setInterval(loadPresence, PRESENCE_POLL_MS);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const retry = () => {
    setStatus('loading');
    setReloadKey((key) => key + 1);
  };

  const reload = () => setReloadKey((key) => key + 1);

  const openCreate = () => {
    setFormTarget(null);
    setModalOpen(true);
  };

  const openEdit = (poi: PoiSummary) => {
    setFormTarget(poi);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // API06: chỉ gọi sau khi Admin xác nhận trong Popconfirm (PRD 3.3.8 - 5a).
  const handleDelete = async (poi: PoiSummary) => {
    setDeletingId(poi.id);

    try {
      const result = await deletePoi(poi.id);

      message.success(
        result.deletedTranslations > 0
          ? `Đã xóa điểm tham quan và ${result.deletedTranslations} nội dung thuyết minh`
          : 'Đã xóa điểm tham quan'
      );
      reload();
    } catch (error) {
      // 401 do interceptor chuyển trang, không cần báo thêm.
      if (readHttpStatus(error) === 401) return;

      const parsed = readApiError(error);

      message.error(
        parsed.status === null
          ? 'Không kết nối được máy chủ. Vui lòng thử lại.'
          : parsed.message
      );

      // 404: điểm đã bị xóa ở nơi khác -> tải lại danh sách cho khớp CSDL.
      if (parsed.status === 404) reload();
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<PoiSummary> = [
    ...DATA_COLUMNS,
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      render: (_value, poi) => (
        <Space size={4}>
          <Button size="small" onClick={() => openEdit(poi)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa điểm tham quan?"
            description="Sẽ xóa cả nội dung và audio của điểm này."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            onConfirm={() => {
              void handleDelete(poi);
            }}
          >
            <Button size="small" danger loading={deletingId === poi.id}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Gợi ý thứ tự kế tiếp; Admin vẫn sửa được trong hộp thoại.
  const defaultOrderIndex =
    pois.length === 0 ? 1 : Math.max(...pois.map((poi) => poi.orderIndex)) + 1;

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Typography.Title level={4} className="admin-page-title">
            Quản lý điểm tham quan
          </Typography.Title>
          <Typography.Text type="secondary">
            Danh sách điểm của địa danh hiện tại.
          </Typography.Text>
        </div>

        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm điểm
        </Button>
      </header>

      <section className="admin-stats">
        <Card variant="outlined" className="admin-stat-card">
          <Statistic
            title="Đang truy cập"
            value={presence?.activeSessions ?? 0}
            prefix={<TeamOutlined />}
            loading={presence === null && !presenceStale}
          />
        </Card>
        <Card variant="outlined" className="admin-stat-card">
          <Statistic
            title="Tổng lượt truy cập"
            value={presence?.totalSessions ?? 0}
            prefix={<EyeOutlined />}
            loading={presence === null && !presenceStale}
          />
        </Card>
        <Card variant="outlined" className="admin-stat-card">
          <Statistic
            title="Số điểm tham quan"
            value={pois.length}
            prefix={<EnvironmentOutlined />}
            loading={status === 'loading'}
          />
        </Card>
      </section>

      {presenceStale && (
        <Typography.Text type="warning" className="admin-stats-note">
          Không cập nhật được số liệu truy cập.
        </Typography.Text>
      )}

      {status === 'loading' && (
        <div className="admin-center">
          <Spin size="large" />
        </div>
      )}

      {status === 'error' && (
        <Result
          status="error"
          title="Không tải được danh sách điểm tham quan"
          subTitle="Kiểm tra kết nối tới máy chủ rồi thử lại."
          extra={
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={retry}
            >
              Thử lại
            </Button>
          }
        />
      )}

      {status === 'ready' && (
        <Table<PoiSummary>
          className="admin-table"
          rowKey="id"
          columns={columns}
          dataSource={pois}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có điểm tham quan nào"
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Thêm điểm
                </Button>
              </Empty>
            ),
          }}
        />
      )}

      <PoiFormModal
        open={modalOpen}
        poi={formTarget}
        defaultOrderIndex={defaultOrderIndex}
        existingPois={pois}
        onClose={closeModal}
        onSaved={reload}
      />
    </div>
  );
}
