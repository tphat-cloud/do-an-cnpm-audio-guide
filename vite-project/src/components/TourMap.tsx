import { useEffect, useState } from 'react';
import { Button } from 'antd';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
// Vite không tự resolve ảnh marker mà CSS của Leaflet trỏ tới, nên import trực
// tiếp để bundler phát ảnh ra dist (lỗi marker trắng khi build bằng Vite).
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import type { PoiSummary } from '../types';

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

/** Căn khung nhìn vừa tất cả các điểm của địa danh (PRD 7.1.2 - bước 2, 3). */
function FitToPois({ pois }: { pois: PoiSummary[] }) {
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
  onListen: (poiId: number) => void;
}

/**
 * Bản đồ màn hình tham quan (UC06). Không có marker vị trí du khách vì trang
 * chạy qua HTTP nên trình duyệt chặn GPS.
 */
export function TourMap({
  pois,
  listenedPoiIds,
  selectedPoiId,
  listenLabel,
  onListen,
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

        {pois.map((poi) => {
          const isListened = listenedPoiIds.includes(poi.id);
          const isSelected = poi.id === selectedPoiId;

          return (
            <Marker
              key={poi.id}
              position={[poi.latitude, poi.longitude]}
              icon={
                isSelected
                  ? ICON_ACTIVE
                  : isListened
                    ? ICON_LISTENED
                    : ICON_NOT_LISTENED
              }
              zIndexOffset={isSelected ? 500 : 0}
            >
              <Popup>
                <div className="stg-map-popup">
                  <span className="stg-map-popup-name">{poi.name}</span>
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
