import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGpsStore } from '../store/useGpsStore';

/**
 * Bật/tắt chế độ Demo giả lập GPS: Ctrl + Shift + D, hoặc tham số ?demo=true.
 * Ngoài phạm vi PRD, chỉ phục vụ test khi nhóm không có mặt ở thực địa.
 */
export function DemoModeShortcut() {
  const [searchParams] = useSearchParams();
  const demoEnabled = useGpsStore((state) => state.demoEnabled);
  const setDemoEnabled = useGpsStore((state) => state.setDemoEnabled);
  const wantsDemo = searchParams.get('demo') === 'true';

  // ?demo=true chỉ bật chứ không tự tắt, để phím tắt vẫn dùng để thoát được.
  useEffect(() => {
    if (wantsDemo) setDemoEnabled(true);
  }, [wantsDemo, setDemoEnabled]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey || event.altKey) return;
      if (event.key.toLowerCase() !== 'd') return;

      event.preventDefault();
      setDemoEnabled(!demoEnabled);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [demoEnabled, setDemoEnabled]);

  return null;
}
