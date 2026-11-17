import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, App as AntApp, Button, Empty, Listy, Result, Spin, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { fetchPoiNarration } from '../api/content';
import { AudioPlayer, type PlayerState } from '../components/AudioPlayer';
import { DemoGpsPanel } from '../components/DemoGpsPanel';
import { LanguageSelector } from '../components/LanguageSelector';
import { TourMap } from '../components/TourMap';
import { useGeolocationWatch } from '../hooks/useGeolocationWatch';
import { MESSAGES } from '../i18n/messages';
import { useGpsStore } from '../store/useGpsStore';
import type { GpsFix } from '../store/useGpsStore';
import { readStoredLocationId, useTourStore } from '../store/useTourStore';
import { findTriggeredPoi, formatDistance, haversineMeters, MAX_ACCURACY_M } from '../utils/geo';
import type { Lang, PoiNarration, PoiSummary } from '../types';

type NarrationStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Màn hình tham quan (PRD 7.1.2 - UC03, UC04, UC05, UC06, UC10).
 * Vị trí du khách lấy từ GPS thật; khi bật chế độ Demo thì dùng vị trí giả lập.
 */
export function TourPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();

  const lang = useTourStore((state) => state.lang);
  const setLang = useTourStore((state) => state.setLang);
  const locationId = useTourStore((state) => state.locationId);
  const location = useTourStore((state) => state.location);
  const status = useTourStore((state) => state.status);
  const loadLocation = useTourStore((state) => state.loadLocation);
  const listenedPoiIds = useTourStore((state) => state.listenedPoiIds);
  const markListened = useTourStore((state) => state.markListened);
  const refreshing = useTourStore((state) => state.refreshing);
  const refreshFailed = useTourStore((state) => state.refreshFailed);
  const retryLangReload = useTourStore((state) => state.retryLangReload);

  const fix = useGpsStore((state) => state.fix);
  const gpsStatus = useGpsStore((state) => state.status);
  const demoEnabled = useGpsStore((state) => state.demoEnabled);
  const clickToMove = useGpsStore((state) => state.clickToMove);
  const moveTo = useGpsStore((state) => state.moveTo);

  // GPS thật chỉ theo dõi khi tắt chế độ Demo; retry dùng khi quyền bị mất.
  const retryGps = useGeolocationWatch();

  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [selectionNonce, setSelectionNonce] = useState(0);
  // Chỉ tự phát khi du khách chọn điểm; đổi ngôn ngữ thì chờ du khách bấm phát.
  const [autoPlay, setAutoPlay] = useState(false);
  const [narration, setNarration] = useState<PoiNarration | null>(null);
  const [narrationStatus, setNarrationStatus] = useState<NarrationStatus>('idle');
  const narrationRef = useRef<HTMLDivElement | null>(null);
  // Bỏ qua phản hồi cũ khi du khách đổi điểm hoặc đổi ngôn ngữ liên tiếp.
  const narrationRequestRef = useRef(0);
  // Trạng thái trình phát để biết bài đang phát dở hay đã kết thúc (UC04 - 5b).
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  // Điểm geofence chờ phát sau khi bài hiện tại kết thúc.
  const pendingPoiIdsRef = useRef<number[]>([]);
  const advanceQueueRef = useRef<() => void>(() => {});

  const text = MESSAGES[lang];
  // Đang phát, tạm dừng hoặc đang tải bài mới đều tính là đang bận.
  const playerBusy =
    playerState === 'playing' || playerState === 'paused' || narrationStatus === 'loading';
  const weakGps = !demoEnabled && fix?.source === 'real' && fix.accuracy > MAX_ACCURACY_M;
  const gpsIssue =
    gpsStatus === 'denied' || gpsStatus === 'unavailable' || gpsStatus === 'unsupported'
      ? gpsStatus
      : null;
  // UC02-5a, UC04-1b: mất quyền vị trí thì hướng dẫn bật lại và vẫn cho chọn điểm thủ công.
  const gpsIssueText =
    !demoEnabled && gpsIssue
      ? {
          denied: { title: text.gpsDeniedTitle, help: text.gpsDeniedHelp },
          unavailable: { title: text.gpsUnavailableTitle, help: text.gpsUnavailableHelp },
          unsupported: { title: text.gpsUnsupportedTitle, help: text.gpsUnsupportedHelp },
        }[gpsIssue]
      : null;

  // Tải lại trang /tour (F5) vẫn có dữ liệu nhờ location_id lưu trong sessionStorage.
  useEffect(() => {
    if (location || status === 'loading' || status === 'error') return;

    const storedId = readStoredLocationId();
    if (storedId === null) {
      navigate('/', { replace: true });
      return;
    }
    void loadLocation(storedId);
  }, [location, status, loadLocation, navigate]);

  useEffect(() => {
    if (selectedPoiId === null) return;
    narrationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedPoiId, selectionNonce]);

  /** Lấy văn bản và audio của điểm theo ngôn ngữ đang chọn (API03). */
  const loadNarration = useCallback(
    async (poiId: number, language: Lang) => {
      const requestId = narrationRequestRef.current + 1;
      narrationRequestRef.current = requestId;

      setNarration(null);
      setNarrationStatus('loading');

      try {
        const data = await fetchPoiNarration(poiId, language);
        if (narrationRequestRef.current !== requestId) return;

        setNarration(data);
        setNarrationStatus('ready');
        // Điểm không có audio thì không thể nghe, đánh dấu ngay và bỏ qua để
        // hàng chờ không bị kẹt ở một bài không phát được.
        if (!data.audioUrl) {
          markListened(data.poiId);
          advanceQueueRef.current();
        }
      } catch {
        if (narrationRequestRef.current !== requestId) return;
        setNarrationStatus('error');
        advanceQueueRef.current();
      }
    },
    [markListened]
  );

  /** Phát một điểm ngay, không đụng tới hàng chờ. */
  const playPoi = useCallback(
    (poiId: number) => {
      setPlayerState('idle');
      setSelectedPoiId(poiId);
      setSelectionNonce((nonce) => nonce + 1);
      setAutoPlay(true);
      void loadNarration(poiId, lang);
    },
    [lang, loadNarration]
  );

  /** Chọn điểm thủ công - phát ngay và bỏ hàng chờ (UC10 - 5a). */
  const handleSelectPoi = useCallback(
    (poiId: number) => {
      pendingPoiIdsRef.current = [];
      playPoi(poiId);
    },
    [playPoi]
  );

  /** Bài hiện tại xong hoặc lỗi: phát bài kế tiếp trong hàng chờ (UC04 - 5b). */
  const playNextQueued = useCallback(() => {
    const nextPoiId = pendingPoiIdsRef.current.shift();
    if (nextPoiId !== undefined) playPoi(nextPoiId);
  }, [playPoi]);

  useEffect(() => {
    advanceQueueRef.current = playNextQueued;
  }, [playNextQueued]);

  /**
   * Geofence: đang phát hoặc tạm dừng bài khác thì đưa điểm mới vào hàng chờ
   * thay vì cắt ngang (UC04 - 5b).
   */
  const handleGeofencePoi = useCallback(
    (poi: PoiSummary) => {
      if (poi.id === selectedPoiId) return;

      if (playerBusy) {
        if (!pendingPoiIdsRef.current.includes(poi.id)) {
          pendingPoiIdsRef.current.push(poi.id);
        }
        void message.info(text.queueToast.replace('{name}', poi.name));
        return;
      }

      playPoi(poi.id);
      void message.info(text.geofenceToast.replace('{name}', poi.name));
    },
    [message, playPoi, playerBusy, selectedPoiId, text]
  );

  // Geofence luôn gọi handler mới nhất mà không phải đăng ký lại listener.
  const triggerPoiRef = useRef(handleGeofencePoi);

  useEffect(() => {
    triggerPoiRef.current = handleGeofencePoi;
  }, [handleGeofencePoi]);

  /** Đổi ngôn ngữ: dừng audio hiện tại, tải lại nội dung, không tự phát (UC03). */
  const handleChangeLang = (next: Lang) => {
    if (next === lang) return;

    pendingPoiIdsRef.current = [];
    setAutoPlay(false);
    setLang(next);

    if (selectedPoiId !== null) {
      void loadNarration(selectedPoiId, next);
    }
  };

  /**
   * UC04: mỗi khi có vị trí mới (GPS thật hoặc giả lập), tính khoảng cách Haversine
   * tới các điểm và tự phát thuyết minh cho điểm gần nhất nằm trong bán kính.
   * Vị trí đến từ hệ thống bên ngoài nên theo dõi store thay vì đồng bộ bằng effect,
   * tránh gọi setState ngay trong thân effect.
   */
  useEffect(() => {
    const onFix = (fix: GpsFix | null) => {
      if (!fix) return;

      // BR06: bỏ qua tọa độ GPS thật có sai số lớn (tín hiệu yếu).
      if (fix.source === 'real' && fix.accuracy > MAX_ACCURACY_M) return;

      // Đọc state mới nhất từ store để không giữ closure cũ của địa danh/ngôn ngữ.
      const tour = useTourStore.getState();
      if (!tour.location) return;

      const hit = findTriggeredPoi(tour.location.pois, fix);
      if (!hit) return;

      // BR04: mỗi điểm chỉ tự phát một lần trong phiên; điểm đã nghe cũng bỏ qua.
      if (tour.triggeredPoiIds.includes(hit.poi.id)) return;
      if (tour.listenedPoiIds.includes(hit.poi.id)) return;

      tour.markTriggered(hit.poi.id);
      triggerPoiRef.current(hit.poi);
    };

    return useGpsStore.subscribe((state) => onFix(state.fix));
  }, []);

  if (!location || status === 'idle' || status === 'loading') {
    return (
      <div className="stg-screen stg-center">
        <Spin size="large" description={text.loading}>
          <div className="stg-spin-holder" />
        </Spin>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="stg-screen stg-center">
        <Result
          status="error"
          title={text.loadError}
          extra={
            <Button
              type="primary"
              size="large"
              className="stg-touch"
              icon={<ReloadOutlined />}
              onClick={() => {
                const storedId = readStoredLocationId();
                if (storedId === null) {
                  navigate('/', { replace: true });
                  return;
                }
                void loadLocation(storedId);
              }}
            >
              {text.retry}
            </Button>
          }
        />
      </div>
    );
  }

  const hasPois = location.pois.length > 0;

  return (
    <div className="stg-screen">
      <header className="stg-topbar">
        <Button
          type="text"
          className="stg-icon-button"
          aria-label={text.back}
          onClick={() => navigate(locationId === null ? '/' : `/?location_id=${locationId}`)}
          icon={<ArrowLeftOutlined />}
        />
        <span className="stg-topbar-title">{location.name}</span>
      </header>

      <div className="stg-lang-bar">
        <LanguageSelector value={lang} onChange={handleChangeLang} />

        {/* Đổi ngôn ngữ: giữ tên điểm cũ trên bản đồ/danh sách, chỉ hiện chỉ báo nhỏ. */}
        {refreshing && (
          <span className="stg-inline-loading">
            <Spin size="small" />
            {text.langReloading}
          </span>
        )}

        {refreshFailed && (
          <Alert
            className="stg-lang-notice"
            type="warning"
            showIcon
            title={text.langLoadError}
            action={
              <Button size="small" icon={<ReloadOutlined />} onClick={retryLangReload}>
                {text.retry}
              </Button>
            }
          />
        )}
      </div>

      {gpsIssueText && (
        <Alert
          className="stg-gps-notice"
          type={gpsIssue === 'unsupported' ? 'info' : 'warning'}
          showIcon
          title={gpsIssueText.title}
          description={
            <>
              <div>{gpsIssueText.help}</div>
              {(gpsIssue === 'denied' || gpsIssue === 'unavailable') && (
                <Button
                  className="stg-gps-retry"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={retryGps}
                >
                  {text.retry}
                </Button>
              )}
            </>
          }
        />
      )}

      {weakGps && (
        <Alert
          className="stg-gps-notice"
          type="warning"
          showIcon
          title={text.weakGpsWarning}
          description={text.weakGpsHelp}
        />
      )}

      <main className="stg-main">
        {!hasPois ? (
          <Empty
            className="stg-empty"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={text.noPoiTour}
          />
        ) : (
          <>
            <TourMap
              pois={location.pois}
              listenedPoiIds={listenedPoiIds}
              selectedPoiId={selectedPoiId}
              listenLabel={text.mapListen}
              distanceLabel={text.distanceFromYou}
              onListen={handleSelectPoi}
              userLocation={fix}
              pickingEnabled={demoEnabled && clickToMove}
              onMapPick={moveTo}
            />

            {selectedPoiId === null && (
              <Alert type="info" showIcon title={text.selectPoiHint} />
            )}

            {selectedPoiId !== null && (
              <section className="stg-narration" ref={narrationRef}>
                <p className="stg-section-label">{text.narrationTitle}</p>

                {narrationStatus === 'loading' && (
                  <div className="stg-narration-loading">
                    <Spin size="small" />
                    <span>{text.narrationLoading}</span>
                  </div>
                )}

                {narrationStatus === 'error' && (
                  <Alert
                    type="error"
                    showIcon
                    title={text.narrationError}
                    action={
                      <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          if (selectedPoiId !== null) void loadNarration(selectedPoiId, lang);
                        }}
                      >
                        {text.retry}
                      </Button>
                    }
                  />
                )}

                {narrationStatus === 'ready' && narration && (
                  <>
                    <h2 className="stg-narration-name">{narration.name}</h2>

                    {narration.audioUrl ? (
                      <AudioPlayer
                        key={`${narration.poiId}-${lang}-${selectionNonce}`}
                        src={narration.audioUrl}
                        autoPlay={autoPlay}
                        text={text}
                        onStarted={() => markListened(narration.poiId)}
                        onStateChange={setPlayerState}
                        onEnded={playNextQueued}
                        onError={playNextQueued}
                      />
                    ) : (
                      <Alert type="warning" showIcon title={text.noAudioNotice} />
                    )}

                    {narration.fallback && (
                      <Alert
                        className="stg-notice"
                        type="warning"
                        showIcon
                        title={text.fallbackNotice}
                        description={<Tag color="default">VI</Tag>}
                      />
                    )}

                    <p className="stg-narration-text">
                      {narration.text || text.emptyText}
                    </p>
                  </>
                )}
              </section>
            )}

            <section className="stg-section">
              <p className="stg-section-label">{text.tourSubtitle}</p>
              <Listy<PoiSummary>
                className="stg-list"
                items={location.pois}
                rowKey="id"
                itemRender={(poi, index) => {
                  const isListened = listenedPoiIds.includes(poi.id);
                  const isActive = poi.id === selectedPoiId;

                  return (
                    <button
                      type="button"
                      className={`stg-poi-button${isActive ? ' is-active' : ''}`}
                      onClick={() => handleSelectPoi(poi.id)}
                    >
                      <span className="stg-poi-index">{index + 1}</span>
                      <EnvironmentOutlined className="stg-poi-icon" aria-hidden />
                      <span className="stg-poi-name">{poi.name}</span>
                      <span className="stg-poi-distance">
                        {fix ? formatDistance(haversineMeters(fix, poi)) : '—'}
                      </span>
                      {isListened && <Tag className="stg-tag-listened">{text.listened}</Tag>}
                      <RightOutlined className="stg-poi-arrow" aria-hidden />
                    </button>
                  );
                }}
              />
            </section>
          </>
        )}
      </main>

      {/* Bảng điều khiển giả lập GPS, chỉ xuất hiện khi bật chế độ Demo. */}
      <DemoGpsPanel pois={location.pois} text={text} />
    </div>
  );
}
