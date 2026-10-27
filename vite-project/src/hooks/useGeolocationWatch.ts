import { useEffect } from 'react';
import { useGpsStore } from '../store/useGpsStore';

/** Mã lỗi Geolocation API: 1 = người dùng từ chối quyền. */
const PERMISSION_DENIED = 1;

/**
 * Theo dõi GPS thật của thiết bị (UC02 - bước 3). Khi bật chế độ Demo thì dừng hẳn
 * watchPosition để tọa độ thật không ghi đè vị trí giả lập; tắt Demo là tự theo dõi lại.
 */
export function useGeolocationWatch(): void {
  const demoEnabled = useGpsStore((state) => state.demoEnabled);
  const setRealFix = useGpsStore((state) => state.setRealFix);
  const setStatus = useGpsStore((state) => state.setStatus);

  useEffect(() => {
    if (demoEnabled) return;

    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }

    setStatus('watching');
    const watchId = navigator.geolocation.watchPosition(
      (position) => setRealFix(position.coords),
      (error) =>
        setStatus(error.code === PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [demoEnabled, setRealFix, setStatus]);
}
