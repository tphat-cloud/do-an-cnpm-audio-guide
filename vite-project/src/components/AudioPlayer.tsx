import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Progress, Space } from 'antd';
import { PauseOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { UiText } from '../i18n/messages';

interface Props {
  src: string;
  /** Chỉ tự phát khi du khách vừa chọn điểm; đổi ngôn ngữ thì không tự phát. */
  autoPlay: boolean;
  text: UiText;
  /** Audio bắt đầu phát thật sự (không tính lúc bị trình duyệt chặn). */
  onStarted: () => void;
}

/** idle: chưa phát, paused: tạm dừng, ended: đã nghe xong (PRD 2.7.4). */
type PlayerState = 'idle' | 'playing' | 'paused' | 'ended' | 'blocked' | 'error';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Trình phát thuyết minh (UC05 - PRD 7.1.2): thẻ audio HTML5 kèm nút bấm
 * Tạm dừng / Phát tiếp / Nghe lại, thanh tiến độ và các trạng thái lỗi.
 */
export function AudioPlayer({ src, autoPlay, text, onStarted }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setState('idle');
    setCurrentTime(0);
    setDuration(0);
    audio.load();

    if (!autoPlay) return;

    // Trình duyệt chặn tự phát -> hiện nút "Bấm để nghe" (UC05 - 4a).
    audio
      .play()
      .then(() => setState('playing'))
      .catch(() => setState('blocked'));
  }, [src, autoPlay]);

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio
      .play()
      .then(() => setState('playing'))
      .catch(() => setState('blocked'));
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      play();
    } else {
      audio.pause();
      setState('paused');
    }
  };

  // Nghe lại: quay về đầu file và phát lại từ đầu.
  const replay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    play();
  };

  // Tải file lỗi hoặc mất mạng: nạp lại nguồn rồi thử phát (UC05 - 4b).
  const retry = () => {
    const audio = audioRef.current;
    if (!audio) return;

    setState('idle');
    audio.load();
    play();
  };

  const percent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="stg-player">
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        onPlay={() => {
          setState('playing');
          // PRD UC04/UC10: điểm được đánh dấu đã nghe ngay khi bắt đầu phát,
          // không phải chờ hết file ("đã nghe xong" chỉ là trạng thái trình phát).
          onStarted();
        }}
        onPause={() => setState((prev) => (prev === 'playing' ? 'paused' : prev))}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => setState('ended')}
        onError={() => setState('error')}
      />

      {state === 'error' ? (
        <Alert
          type="error"
          showIcon
          title={text.audioError}
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={retry}>
              {text.retry}
            </Button>
          }
        />
      ) : state === 'blocked' ? (
        <Button
          type="primary"
          size="large"
          block
          className="stg-touch"
          icon={<PlayCircleOutlined />}
          onClick={play}
        >
          {text.tapToPlay}
        </Button>
      ) : (
        <>
          <Progress
            percent={percent}
            showInfo={false}
            strokeColor="#1677ff"
            railColor="#f0f0f0"
            size="small"
          />
          <div className="stg-player-time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <Space size={8} wrap>
            <Button
              type="primary"
              className="stg-touch"
              icon={state === 'playing' ? <PauseOutlined /> : <PlayCircleOutlined />}
              onClick={togglePlay}
            >
              {state === 'playing'
                ? text.pause
                : state === 'paused'
                  ? text.resume
                  : text.tapToPlay}
            </Button>
            <Button className="stg-touch" icon={<ReloadOutlined />} onClick={replay}>
              {text.replay}
            </Button>
            {state === 'ended' && (
              <span className="stg-player-done">{text.finished}</span>
            )}
          </Space>
        </>
      )}
    </div>
  );
}
