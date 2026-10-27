import { create } from 'zustand';
import type { LatLng } from '../types';

/** watching: đang theo dõi GPS thật; mock: đang ở chế độ Demo. */
export type GpsStatus =
  | 'idle'
  | 'watching'
  | 'mock'
  | 'unsupported'
  | 'denied'
  | 'unavailable';

/** Một lần định vị: tọa độ kèm sai số và nguồn (GPS thật hay giả lập). */
export interface GpsFix extends LatLng {
  /** Sai số theo mét của lần định vị. */
  accuracy: number;
  source: 'real' | 'mock';
}

/**
 * Sai số giả lập: đủ nhỏ để không bị coi là "tín hiệu GPS yếu" (BR06) nhưng vẫn
 * vẽ được vòng tròn sai số quanh marker.
 */
const MOCK_ACCURACY_M = 5;

interface GpsState {
  /** Chế độ Demo (giả lập GPS) đang bật hay tắt. */
  demoEnabled: boolean;
  /** Chạm trực tiếp lên bản đồ để đặt vị trí du khách (chỉ có tác dụng khi Demo bật). */
  clickToMove: boolean;
  status: GpsStatus;
  fix: GpsFix | null;
  setDemoEnabled: (enabled: boolean) => void;
  toggleDemo: () => void;
  setClickToMove: (enabled: boolean) => void;
  setStatus: (status: GpsStatus) => void;
  /** Tọa độ từ watchPosition của trình duyệt (UC02). */
  setRealFix: (coordinates: { latitude: number; longitude: number; accuracy: number }) => void;
  /** Dịch chuyển tới tọa độ giả lập khi đang bật Demo. */
  moveTo: (target: LatLng) => void;
}

/**
 * Vị trí du khách dùng chung giữa bản đồ, geofence và bảng điều khiển Demo.
 * Chỉ một nguồn có hiệu lực tại một thời điểm: Demo bật thì GPS thật bị bỏ qua và
 * ngược lại, nhờ vậy tắt Demo là tự quay về vị trí thật.
 */
export const useGpsStore = create<GpsState>()((set, get) => ({
  demoEnabled: false,
  clickToMove: false,
  status: 'idle',
  fix: null,

  setDemoEnabled: (enabled) => {
    if (enabled === get().demoEnabled) return;

    // Tắt Demo phải xóa vị trí giả lập, nếu không marker sẽ đứng yên ở chỗ cũ
    // cho tới khi GPS thật trả về tọa độ đầu tiên.
    set({
      demoEnabled: enabled,
      clickToMove: false,
      status: enabled ? 'mock' : 'idle',
      fix: null,
    });
  },

  toggleDemo: () => get().setDemoEnabled(!get().demoEnabled),

  setClickToMove: (enabled) => set({ clickToMove: enabled }),

  setStatus: (status) => set({ status }),

  setRealFix: ({ latitude, longitude, accuracy }) => {
    if (get().demoEnabled) return;
    set({ fix: { latitude, longitude, accuracy, source: 'real' }, status: 'watching' });
  },

  moveTo: (target) => {
    if (!get().demoEnabled) return;
    set({
      fix: {
        latitude: target.latitude,
        longitude: target.longitude,
        accuracy: MOCK_ACCURACY_M,
        source: 'mock',
      },
      status: 'mock',
    });
  },
}));
