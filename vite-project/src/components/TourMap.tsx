import { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import L from 'leaflet';
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
// Vite không tự resolve ảnh marker mà CSS của Leaflet trỏ tới, nên import trực
// tiếp để bundler phát ảnh ra dist (lỗi marker trắng khi build bằng Vite).
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { formatDistance, haversineMeters } from '../utils/geo';
import type { GpsFix } from '../store/useGpsStore';
import type { LatLng, PoiSummary } from '../types';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Số tile lỗi liên tiếp đủ để coi như mất mạng (UC06 - luồng ngoại lệ 2a). */
const TILE_ERROR_LIMIT = 3;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

/**
 * Marker mặc định của Leaflet là ảnh xanh dương; điểm đã nghe dùng bộ lọc xám,
 * điểm đang chọn thêm quầng sáng (PRD 7.3 - chỉ light mode).
 */
function createMarkerIcon(className: string): L.Icon {
  return new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className,
  });
}

const ICON_NOT_LISTENED = createMarkerIcon('stg-marker');
const ICON_LISTENED = createMarkerIcon('stg-marker stg-marker-listened');
const ICON_ACTIVE = createMarkerIcon('stg-marker stg-marker-active');

/** Marker chuẩn của Leaflet (xanh dương), dùng cho marker kéo được trong form Admin. */
export const POI_MARKER_ICON = ICON_NOT_LISTENED;

/** Thời gian marker du khách trượt từ vị trí cũ sang vị trí mới. */
const MOVE_ANIMATION_MS = 600;

/** Chấm đỏ viền trắng: marker vị trí du khách (UC06 - bước 4). */
const USER_ICON = L.divIcon({
  className: 'stg-user-marker',
  html: '<span class="stg-user-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/**
 * Nhận thao tác chạm lên bản đồ để lấy tọa độ (du khách di chuyển vị trí trong
 * chế độ Demo; Admin chấm tọa độ điểm tham quan trong hộp thoại UC08).
 */
export function MapPicker({ onPick }: { onPick: (target: LatLng) => void }) {
  useMapEvents({
    click: (event) => onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
  });

  return null;
}

/**
 * Đổi con trỏ bản đồ khi đang chọn vị trí. Phải gắn class trực tiếp lên khung Leaflet
 * vì MapContainer chỉ đọc className một lần lúc khởi tạo.
 */
function PickingCursor({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    container.classList.toggle('stg-map-canvas-picking', enabled);

    return () => container.classList.remove('stg-map-canvas-picking');
  }, [map, enabled]);

  return null;
}

/**
 * Marker vị trí du khách: nội suy tọa độ theo từng khung hình để marker trượt mượt
 * tới vị trí mới thay vì nhảy cóc (UC06 - bước 5), kèm vòng tròn sai số định vị.
 */
function UserMarker({ fix }: { fix: GpsFix }) {
  const [shown, setShown] = useState<[number, number]>([fix.latitude, fix.longitude]);
  const fromRef = useRef<[number, number]>(shown);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to: [number, number] = [fix.latitude, fix.longitude];
    if (from[0] === to[0] && from[1] === to[1]) return;

    const startedAt = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / MOVE_ANIMATION_MS);
      // easeOutCubic: rời chỗ nhanh rồi dừng nhẹ ở đích.
      const eased = 1 - (1 - progress) ** 3;
      const next: [number, number] = [
        from[0] + (to[0] - from[0]) * eased,
        from[1] + (to[1] - from[1]) * eased,
      ];

      fromRef.current = next;
      setShown(next);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [fix.latitude, fix.longitude]);

  return (
    <>
      <Circle
        center={shown}
        radius={Math.max(fix.accuracy, 1)}
        pathOptions={{
          color: '#1677ff',
          weight: 1,
          fillColor: '#1677ff',
          fillOpacity: 0.12,
        }}
      />
      <Marker position={shown} icon={USER_ICON} zIndexOffset={800} />
    </>
  );
}

/** Căn khung nhìn vừa tất cả các điểm (màn hình tham quan PRD 7.1.2 và hộp thoại Admin UC08). */
export function FitToPois({ pois }: { pois: PoiSummary[] }) {
  const map = useMap();

  useEffect(() => {
    if (pois.length === 0) return;

    const points = pois.map(
      (poi) => [poi.latitude, poi.longitude] as [number, number]
    );
    map.fitBounds(L.latLngBounds(points), {
      padding: [28, 28],
      // Một điểm duy nhất vẫn cần khung nhìn đủ gần.
      maxZoom: 18,
    });
  }, [map, pois]);

  return null;
}

interface TourMapProps {
  pois: PoiSummary[];
  listenedPoiIds: number[];
  selectedPoiId: number | null;
  listenLabel: string;
  /** Nhãn khoảng cách còn lại trong popup; {distance} được thay bằng số đã định dạng. */
  distanceLabel: string;
  onListen: (poiId: number) => void;
  /** Vị trí du khách (GPS thật hoặc giả lập); chưa định vị được thì chỉ hiện điểm. */
  userLocation: GpsFix | null;
  /** Chế độ Demo: chạm vào bản đồ để di chuyển vị trí du khách. */
  pickingEnabled: boolean;
  onMapPick: (target: LatLng) => void;
}

/**
 * Bản đồ màn hình tham quan (UC06): marker các điểm kèm vị trí du khách. Marker du
 * khách lấy từ useGpsStore nên dùng chung cho GPS thật và chế độ giả lập.
 */
export function TourMap({
  pois,
  listenedPoiIds,
  selectedPoiId,
  listenLabel,
  distanceLabel,
  onListen,
  userLocation,
  pickingEnabled,
  onMapPick,
}: TourMapProps) {
  const [tileErrors, setTileErrors] = useState(0);

  // Mất mạng: ẩn hẳn bản đồ, khách vẫn nghe thủ công từ danh sách (UC06 - 2a).
  if (tileErrors >= TILE_ERROR_LIMIT) return null;

  const center: [number, number] =
    pois.length > 0
      ? [pois[0].latitude, pois[0].longitude]
      : [10.777, 106.6955];

  return (
    <div className="stg-map">
      <MapContainer
        className="stg-map-canvas"
        center={center}
        zoom={17}
        // Cuộn trang trên điện thoại không bị bản đồ giữ lại.
        scrollWheelZoom={false}
        attributionControl
      >
        <TileLayer
          url={OSM_URL}
          attribution={OSM_ATTRIBUTION}
          eventHandlers={{
            tileerror: () => setTileErrors((count) => count + 1),
          }}
        />

        <FitToPois pois={pois} />

        {pickingEnabled && <MapPicker onPick={onMapPick} />}
        <PickingCursor enabled={pickingEnabled} />
        {userLocation && <UserMarker fix={userLocation} />}

        {pois.map((poi) => {
          const isListened = listenedPoiIds.includes(poi.id);
          const isSelected = poi.id === selectedPoiId;

          return (
            <Marker
              key={poi.id}
              position={[poi.latitude, poi.longitude]}
              icon={
                // Đã nghe (xám) ưu tiên hơn đang chọn, nếu không điểm vừa được geofence
                // kích hoạt sẽ mãi giữ màu xanh dương (PRD 6a: marker đổi màu để nhận biết).
                isListened
                  ? ICON_LISTENED
                  : isSelected
                    ? ICON_ACTIVE
                    : ICON_NOT_LISTENED
              }
              zIndexOffset={isSelected ? 500 : 0}
            >
              <Popup>
                <div className="stg-map-popup">
                  <span className="stg-map-popup-name">{poi.name}</span>
                  {userLocation && (
                    <span className="stg-map-popup-distance">
                      {distanceLabel.replace(
                        '{distance}',
                        formatDistance(haversineMeters(userLocation, poi))
                      )}
                    </span>
                  )}
                  <Button
                    type="primary"
                    className="stg-touch"
                    onClick={() => onListen(poi.id)}
                  >
                    {listenLabel}
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
