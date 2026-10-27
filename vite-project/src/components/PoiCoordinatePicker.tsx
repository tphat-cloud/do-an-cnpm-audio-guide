import { useEffect, useMemo, useRef } from 'react';
import { Alert } from 'antd';
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPicker, POI_MARKER_ICON } from './TourMap';
import type { LatLng, PoiSummary } from '../types';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Khung nhìn mặc định khi địa danh chưa có điểm nào (khu Dinh Độc Lập). */
const FALLBACK_CENTER: LatLng = { latitude: 10.777, longitude: 106.6955 };

/** Tọa độ do Form truyền xuống; chưa có thì chưa hiển thị marker. */
export interface CoordinateValue {
  latitude: number | null;
  longitude: number | null;
}

/**
 * AntD Modal có animation khi mở, khiến chiều cao thật của bản đồ chỉ ổn định
 * sau vài trăm ms. Nếu không báo lại cho Leaflet thì tile sẽ lệch/mờ ở vùng rìa
 * (lỗi "tile xám" rất hay gặp). Chờ hết animation rồi invalidateSize một lần,
 * sau đó mới fitBounds (nếu có danh sách điểm) để bounds tính trên kích thước đúng.
 * Chạy MỘT LẦN lúc mount, dùng ref để giữ danh sách điểm ban đầu.
 */
function SetupMapAfterModalAnimation({
  fitPois,
}: {
  fitPois: PoiSummary[];
}) {
  const map = useMap();
  // Giữ danh sách điểm lúc mount để effect không phụ thuộc props, tránh bị
  // cancel khi phụ huynh re-render (vd. Admin click bản đồ trước 300ms).
  const initialPoisRef = useRef(fitPois);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();

      const points = initialPoisRef.current.map(
        (poi) => [poi.latitude, poi.longitude] as [number, number]
      );
      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 18 });
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

/**
 * Marker kéo thả được (PRD 3.3.8 - "kéo marker trên bản đồ để đổi tọa độ").
 * Dùng `L.marker` gốc thay vì `<Marker>` của react-leaflet để giá trị trả về từ
 * `dragend` có kiểu rõ ràng (không phải cast event target).
 */
function DraggablePin({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number;
  longitude: number;
  onPick: (target: LatLng) => void;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  // Giữ callback mới nhất để listener chỉ gắn một lần không nắm closure cũ.
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    const marker = L.marker([latitude, longitude], {
      draggable: true,
      icon: POI_MARKER_ICON,
    }).addTo(map);

    marker.on('dragend', () => {
      const latlng = marker.getLatLng();
      onPickRef.current({ latitude: latlng.lat, longitude: latlng.lng });
    });

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
    // Chỉ tạo marker một lần lúc mount; tọa độ đổi thì effect bên dưới di chuyển theo,
    // nên không cần latitude/longitude trong deps (nếu có, marker sẽ bị tạo lại mỗi lần
    // click/gõ, làm mất state kéo thả).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Giá trị trong Form đổi (click bản đồ hoặc gõ tay) thì di chuyển marker.
  useEffect(() => {
    markerRef.current?.setLatLng([latitude, longitude]);
  }, [latitude, longitude]);

  return null;
}

interface PoiCoordinatePickerProps {
  /** Giá trị hiện của Form; kéo marker/click thì component báo ngược lại. */
  value: CoordinateValue;
  /** Bán kính kích hoạt (m) để vẽ vòng tròn xem trước trên bản đồ. */
  radiusM: number | null;
  /** Danh sách điểm hiện có của địa danh, dùng căn khung nhìn khi mở hộp thoại. */
  existingPois: PoiSummary[];
  /** Lỗi tọa độ do Form gửi xuống, để nhắc ngay cạnh bản đồ (PRD 7.1.4). */
  errorMessage: string | null;
  onPick: (target: LatLng) => void;
}

/**
 * Bản đồ chấm tọa độ trong hộp thoại Thêm/Sửa điểm tham quan (PRD 3.3.8, 7.1.4 - UC08):
 * bấm lên bản đồ để đặt marker, kéo thả marker để hiệu chỉnh, ô vĩ độ/kinh độ cập nhật
 * hai chiều. Vòng tròn bán kính giúp Admin hình dung vùng kích hoạt thuyết minh.
 */
export function PoiCoordinatePicker({
  value,
  radiusM,
  existingPois,
  errorMessage,
  onPick,
}: PoiCoordinatePickerProps) {
  const hasCoordinate = value.latitude !== null && value.longitude !== null;

  // Chỉ fit khung nhìn khi CHƯA có tọa độ (thêm mới, chưa chấm lần nào);
  // có tọa độ rồi thì center prop đã đúng, không cần fit.
  const poisForFit = useMemo(
    () => (hasCoordinate ? [] : existingPois),
    [hasCoordinate, existingPois]
  );

  return (
    <div className="admin-coord-picker">
      <div className="admin-coord-picker-map">
        <MapContainer
          className="admin-coord-canvas"
          center={
            hasCoordinate
              ? ([value.latitude as number, value.longitude as number] as [number, number])
              : [FALLBACK_CENTER.latitude, FALLBACK_CENTER.longitude]
          }
          zoom={17}
          scrollWheelZoom
        >
          <TileLayer url={OSM_URL} attribution={OSM_ATTRIBUTION} />

          <SetupMapAfterModalAnimation fitPois={poisForFit} />
          <MapPicker onPick={onPick} />

          {/* Marker tham chiếu của các điểm khác trong cùng địa danh, giúp Admin
              không chấm trùng chỗ. Không gắn onListen/kéo thả. */}
          {existingPois
            .filter((poi) => {
              // Khi đang sửa, điểm này chính là điểm đang hiển thị qua DraggablePin
              // nên bỏ qua để không trùng marker.
              if (!hasCoordinate) return true;
              return !(
                value.latitude === poi.latitude && value.longitude === poi.longitude
              );
            })
            .map((poi) => (
              <Marker
                key={`ref-${poi.id}`}
                position={[poi.latitude, poi.longitude]}
                icon={POI_MARKER_ICON}
                interactive={false}
              />
            ))}

          {hasCoordinate && (
            <>
              {/* Vòng tròn bán kính kích hoạt để Admin thấy "vùng tự phát" to cỡ nào. */}
              {radiusM !== null && radiusM > 0 && (
                <Circle
                  center={[value.latitude as number, value.longitude as number]}
                  radius={radiusM}
                  pathOptions={{
                    color: '#1677ff',
                    weight: 1,
                    fillColor: '#1677ff',
                    fillOpacity: 0.15,
                  }}
                />
              )}

              <DraggablePin
                latitude={value.latitude as number}
                longitude={value.longitude as number}
                onPick={onPick}
              />
            </>
          )}
        </MapContainer>

        {!hasCoordinate && (
          <div className="admin-coord-picker-hint">
            Bấm lên bản đồ để chọn tọa độ cho điểm tham quan
          </div>
        )}
      </div>

      {errorMessage !== null && (
        <Alert
          type="error"
          showIcon
          title={errorMessage}
          className="admin-coord-picker-error"
        />
      )}

      <p className="admin-coord-picker-note">
        Chạm bản đồ để đặt tọa độ, kéo thả marker để hiệu chỉnh; ô vĩ độ/kinh độ
        cập nhật theo, hoặc nhập tay trực tiếp vào ô.
      </p>
    </div>
  );
}
