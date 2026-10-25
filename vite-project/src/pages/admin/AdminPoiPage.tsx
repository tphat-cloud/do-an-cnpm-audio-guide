import { useEffect, useState } from 'react';
import { Button, Card, Empty, Result, Spin, Statistic, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { EyeOutlined, PlusOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import { fetchAdminLocation, fetchPresence } from '../../api/admin';
import type { PresenceStats } from '../../api/admin';
import type { PoiSummary } from '../../types';
import { AddPoiModal } from './AddPoiModal';

type LoadStatus = 'loading' | 'ready' | 'error';

/** Chu kỳ làm mới số liệu truy cập (API11). */
const PRESENCE_POLL_MS = 10_000;

/**
 * Bảng danh sách điểm (PRD 7.1.4 - UC08). Bản này chỉ xem danh sách và thêm
 * điểm; chưa làm sửa/xóa và chưa gắn bản đồ.
 */
const COLUMNS: TableColumnsType<PoiSummary> = [
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
  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [presence, setPresence] = useState<PresenceStats | null>(null);
  const [presenceStale, setPresenceStale] = useState(false);

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

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

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

        <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
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
          columns={COLUMNS}
          dataSource={pois}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Chưa có điểm tham quan nào"
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
                  Thêm điểm
                </Button>
              </Empty>
            ),
          }}
        />
      )}

      <AddPoiModal
        open={modalOpen}
        defaultOrderIndex={defaultOrderIndex}
        onClose={closeModal}
        onCreated={reload}
      />
    </div>
  );
}
