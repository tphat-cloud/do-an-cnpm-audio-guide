import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Empty, Listy, Result, Spin } from 'antd';
import { ReloadOutlined, EnvironmentOutlined, RightOutlined } from '@ant-design/icons';
import { LanguageSelector } from '../components/LanguageSelector';
import { MESSAGES } from '../i18n/messages';
import { useTourStore } from '../store/useTourStore';
import type { PoiSummary } from '../types';

/**
 * Trang chào (PRD 7.1.1 - UC01, UC02, UC03): đọc location_id từ URL giống mã QR,
 * hiện tên/mô tả địa danh, chọn ngôn ngữ, danh sách điểm và nút bắt đầu.
 */
export function WelcomePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawLocationId = searchParams.get('location_id') ?? '';

  // Mã QR sai (rỗng hoặc không phải số) -> id 0, store trả trạng thái lỗi.
  const locationId = /^\d+$/.test(rawLocationId) ? Number(rawLocationId) : 0;

  const lang = useTourStore((state) => state.lang);
  const setLang = useTourStore((state) => state.setLang);
  const location = useTourStore((state) => state.location);
  const status = useTourStore((state) => state.status);
  const errorKind = useTourStore((state) => state.errorKind);
  const loadLocation = useTourStore((state) => state.loadLocation);

  const [retryCount, setRetryCount] = useState(0);
  // Ảnh bìa lỗi/không tải được thì bỏ hẳn, quay về nền gradient xanh của khối trên cùng.
  const [coverFailed, setCoverFailed] = useState(false);
  const text = MESSAGES[lang];

  useEffect(() => {
    void loadLocation(locationId);
  }, [locationId, retryCount, loadLocation]);

  const retry = () => setRetryCount((count) => count + 1);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="stg-screen stg-center">
        <Spin size="large" description={text.loading}>
          <div className="stg-spin-holder" />
        </Spin>
      </div>
    );
  }

  if (status === 'error' || !location) {
    return (
      <div className="stg-screen stg-center">
        <Result
          status={errorKind === 'invalid' ? 'warning' : 'error'}
          title={errorKind === 'invalid' ? text.invalidQr : text.loadError}
          subTitle={errorKind === 'invalid' ? `location_id=${rawLocationId || '(trống)'}` : undefined}
          extra={
            <Button
              type="primary"
              size="large"
              className="stg-touch"
              icon={<ReloadOutlined />}
              onClick={retry}
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
      <header className="stg-hero">
        {!coverFailed && (
          <img
            className="stg-hero-cover"
            src="/cover.webp"
            alt=""
            aria-hidden
            onError={() => setCoverFailed(true)}
          />
        )}

        <div className="stg-hero-content">
          <span className="stg-badge">SMART TOUR GUIDE</span>
          <h1 className="stg-title">{location.name}</h1>
          {location.description && (
            <p className="stg-description">{location.description}</p>
          )}
        </div>
      </header>

      <main className="stg-main">
        <section className="stg-section">
          <p className="stg-section-label">{text.chooseLanguage}</p>
          <LanguageSelector value={lang} onChange={setLang} />
        </section>

        {hasPois ? (
          <section className="stg-section">
            <p className="stg-section-label">{text.poiListTitle}</p>
            <Listy<PoiSummary>
              className="stg-list"
              items={location.pois}
              rowKey="id"
              itemRender={(poi, index) => (
                <div className="stg-poi-row">
                  <span className="stg-poi-index">{index + 1}</span>
                  <EnvironmentOutlined className="stg-poi-icon" aria-hidden />
                  <span className="stg-poi-name">{poi.name}</span>
                </div>
              )}
            />
          </section>
        ) : (
          <Empty
            className="stg-empty"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={text.noPoi}
          />
        )}
      </main>

      {/* Chưa có điểm nào thì ẩn nút bắt đầu (PRD 7.1.1). */}
      {hasPois && (
        <footer className="stg-footer">
          <Button
            type="primary"
            size="large"
            block
            className="stg-touch stg-start"
            onClick={() => navigate('/tour')}
          >
            {text.startTour}
            <RightOutlined aria-hidden />
          </Button>
        </footer>
      )}
    </div>
  );
}
