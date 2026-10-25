import { useEffect, useState } from 'react';
import { Button, Empty, Result, Spin, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { fetchAdminLocation } from '../../api/admin';
import type { PoiSummary } from '../../types';
import { AddPoiModal } from './AddPoiModal';

type LoadStatus = 'loading' | 'ready' | 'error';

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
