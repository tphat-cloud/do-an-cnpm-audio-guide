import { useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import type { UiText } from '../i18n/messages';
import { useGpsStore } from '../store/useGpsStore';
import type { PoiSummary } from '../types';

interface Props {
  pois: PoiSummary[];
  text: UiText;
}

/** Làm tròn tọa độ hiển thị: 5 chữ số thập phân tương đương sai số khoảng 1 mét. */
function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

/**
 * Bảng điều khiển giả lập GPS (ngoài phạm vi PRD, phục vụ demo khi không ở thực địa).
 * Cho phép nhảy nhanh tới từng điểm tham quan hoặc chạm trực tiếp lên bản đồ; mọi
 * thay đổi chỉ có hiệu lực khi chế độ Demo đang bật.
 */
export function DemoGpsPanel({ pois, text }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const demoEnabled = useGpsStore((state) => state.demoEnabled);
  const clickToMove = useGpsStore((state) => state.clickToMove);
  const fix = useGpsStore((state) => state.fix);
  const setDemoEnabled = useGpsStore((state) => state.setDemoEnabled);
  const setClickToMove = useGpsStore((state) => state.setClickToMove);
  const moveTo = useGpsStore((state) => state.moveTo);

  if (!demoEnabled) return null;

  return (
    <aside
      className={`stg-demo${collapsed ? ' is-collapsed' : ''}`}
      aria-label={text.demoTitle}
    >
      <div
        className="stg-demo-head"
        onClick={collapsed ? () => setCollapsed(false) : undefined}
      >
        <span className="stg-demo-badge">[DEMO ACTIVE]</span>
        <span className="stg-demo-title">{text.demoTitle}</span>
        <Button
          type="text"
          size="small"
          className="stg-demo-close"
          aria-label={collapsed ? text.demoExpand : text.demoCollapse}
          icon={collapsed ? <PlusOutlined /> : <MinusOutlined />}
          onClick={() => setCollapsed((value) => !value)}
        />
        <Button
          type="text"
          size="small"
          className="stg-demo-close"
          aria-label={text.demoExit}
          icon={<CloseOutlined />}
          onClick={() => setDemoEnabled(false)}
        />
      </div>

      {!collapsed && (
        <>
          <p className="stg-demo-coords">
            {fix
              ? `${formatCoordinate(fix.latitude)}, ${formatCoordinate(fix.longitude)}`
              : text.demoNoPosition}
          </p>

          <div className="stg-demo-list">
            {pois.length === 0 ? (
              <span className="stg-demo-empty">{text.demoNoPoi}</span>
            ) : (
              pois.map((poi) => (
                <Button
                  key={poi.id}
                  size="small"
                  block
                  className="stg-demo-poi"
                  onClick={() => moveTo({ latitude: poi.latitude, longitude: poi.longitude })}
                >
                  {`${text.demoGoTo} ${poi.name}`}
                </Button>
              ))
            )}
          </div>

          <Button
            size="small"
            block
            type={clickToMove ? 'primary' : 'default'}
            className="stg-demo-toggle stg-touch"
            onClick={() => setClickToMove(!clickToMove)}
          >
            {clickToMove ? text.demoClickMapOff : text.demoClickMapOn}
          </Button>

          {clickToMove && <span className="stg-demo-hint">{text.demoClickHint}</span>}
        </>
      )}
    </aside>
  );
}
