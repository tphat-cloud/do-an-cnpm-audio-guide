import { useState } from 'react';
import { Alert, App, Button, Col, Form, Input, InputNumber, Modal, Row } from 'antd';
import {
  ADMIN_LOCATION_ID,
  createPoi,
  readApiError,
  updatePoi,
} from '../../api/admin';
import { readHttpStatus } from '../../api/client';
import type { PoiSummary } from '../../types';

interface PoiFormModalProps {
  open: boolean;
  /** null: thêm điểm mới (API04); có giá trị: sửa điểm đó (API05). */
  poi: PoiSummary | null;
  defaultOrderIndex: number;
  onClose: () => void;
  onSaved: () => void;
}

interface PoiFormValues {
  name: string;
  radiusM: number | null;
  orderIndex: number | null;
  latitude: number | null;
  longitude: number | null;
}

/** Các ô có thể nhận lỗi theo trường từ API04/API05. */
const KNOWN_FIELDS: ReadonlySet<keyof PoiFormValues> = new Set([
  'name',
  'radiusM',
  'orderIndex',
  'latitude',
  'longitude',
]);

const DEFAULT_RADIUS_M = 10;

/**
 * Hộp thoại Thêm/Sửa điểm tham quan (PRD 7.1.4 - UC08), dùng chung cho API04
 * và API05. Chưa có bản đồ: Admin nhập tay vĩ độ/kinh độ. Lỗi theo trường được
 * hiện ngay tại ô tương ứng; lỗi mạng giữ nguyên dữ liệu và có nút "Thử lại".
 */
export function PoiFormModal({
  open,
  poi,
  defaultOrderIndex,
  onClose,
  onSaved,
}: PoiFormModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PoiFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEdit = poi !== null;

  // Đóng hộp thoại thì xóa lỗi cũ; lần mở sau biểu mẫu được tạo lại với giá trị mặc định.
  const handleClose = () => {
    setSubmitError(null);
    onClose();
  };

  const handleFinish = async (values: PoiFormValues) => {
    if (
      values.radiusM === null ||
      values.orderIndex === null ||
      values.latitude === null ||
      values.longitude === null
    ) {
      return;
    }

    const payload = {
      name: values.name.trim(),
      latitude: values.latitude,
      longitude: values.longitude,
      radiusM: values.radiusM,
      orderIndex: values.orderIndex,
    };

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (poi === null) {
        await createPoi({ locationId: ADMIN_LOCATION_ID, ...payload });
      } else {
        await updatePoi(poi.id, payload);
      }

      message.success(
        isEdit ? 'Đã cập nhật điểm tham quan' : 'Đã thêm điểm tham quan'
      );
      onSaved();
      handleClose();
    } catch (error) {
      const status = readHttpStatus(error);

      // 401 do interceptor chuyển trang, không cần báo thêm.
      if (status === 401) return;

      const parsed = readApiError(error);

      if (status === 409) {
        form.setFields([{ name: 'name', errors: ['Tên điểm đã tồn tại'] }]);
      } else if (status === 400) {
        const fieldErrors = Object.entries(parsed.errors)
          .filter(([field]) => KNOWN_FIELDS.has(field as keyof PoiFormValues))
          .map(([field, text]) => ({
            name: field as keyof PoiFormValues,
            errors: [text],
          }));

        if (fieldErrors.length > 0) {
          form.setFields(fieldErrors);
        } else {
          setSubmitError(parsed.message);
        }
      } else if (status === 404) {
        // Sửa một điểm vừa bị xóa ở nơi khác.
        setSubmitError(parsed.message);
      } else {
        setSubmitError('Không kết nối được máy chủ. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Sửa thì điền sẵn giá trị hiện tại của điểm; thêm mới thì dùng giá trị mặc định.
  const initialValues: PoiFormValues =
    poi === null
      ? {
          name: '',
          radiusM: DEFAULT_RADIUS_M,
          orderIndex: defaultOrderIndex,
          latitude: null,
          longitude: null,
        }
      : {
          name: poi.name,
          radiusM: poi.radiusM,
          orderIndex: poi.orderIndex,
          latitude: poi.latitude,
          longitude: poi.longitude,
        };

  return (
    <Modal
      title={isEdit ? 'Sửa điểm tham quan' : 'Thêm điểm tham quan'}
      open={open}
      width={640}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={submitting}
      maskClosable={!submitting}
      cancelButtonProps={{ disabled: submitting }}
      destroyOnHidden
      onOk={() => form.submit()}
      onCancel={handleClose}
    >
      {submitError !== null && (
        <Alert
          className="admin-modal-alert"
          type="error"
          showIcon
          title={submitError}
          action={
            <Button size="small" onClick={() => form.submit()}>
              Thử lại
            </Button>
          }
        />
      )}

      <Form<PoiFormValues>
        key={poi === null ? 'create' : `edit-${poi.id}`}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={false}
        disabled={submitting}
        initialValues={initialValues}
      >
        <Form.Item
          name="name"
          label="Tên điểm"
          rules={[
            { required: true, whitespace: true, message: 'Vui lòng nhập tên điểm tham quan' },
            { max: 255, message: 'Tên điểm tối đa 255 ký tự' },
          ]}
        >
          <Input placeholder="Ví dụ: Sảnh chính" autoFocus />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="radiusM"
              label="Bán kính (m)"
              rules={[
                { required: true, message: 'Bán kính phải từ 1 đến 100m' },
                { type: 'number', min: 1, max: 100, message: 'Bán kính phải từ 1 đến 100m' },
              ]}
            >
              <InputNumber min={1} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="orderIndex"
              label="Thứ tự"
              rules={[
                { required: true, message: 'Vui lòng nhập thứ tự' },
                { type: 'number', min: 0, message: 'Thứ tự phải là số nguyên không âm' },
              ]}
            >
              <InputNumber min={0} precision={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="latitude"
              label="Vĩ độ"
              rules={[
                { required: true, message: 'Vui lòng nhập vĩ độ' },
                { type: 'number', min: -90, max: 90, message: 'Tọa độ không hợp lệ' },
              ]}
            >
              <InputNumber
                min={-90}
                max={90}
                step={0.000001}
                style={{ width: '100%' }}
                placeholder="10.7769000"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="longitude"
              label="Kinh độ"
              rules={[
                { required: true, message: 'Vui lòng nhập kinh độ' },
                { type: 'number', min: -180, max: 180, message: 'Tọa độ không hợp lệ' },
              ]}
            >
              <InputNumber
                min={-180}
                max={180}
                step={0.000001}
                style={{ width: '100%' }}
                placeholder="106.6954000"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
