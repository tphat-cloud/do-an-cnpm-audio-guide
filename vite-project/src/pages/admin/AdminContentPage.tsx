import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, App, Button, Empty, Result, Select, Spin, Tabs, Typography } from 'antd';
import { CheckCircleFilled, ReloadOutlined } from '@ant-design/icons';
import {
  fetchAdminLocation,
  fetchPoiContent,
  readApiError,
  savePoiTranslation,
} from '../../api/admin';
import { readHttpStatus } from '../../api/client';
import type { Lang, PoiSummary } from '../../types';
import { NarrationEditor } from './NarrationEditor';
import {
  ADMIN_LANGS,
  LANG_LABELS,
  createEmptyDrafts,
  validateAudioFile,
  type LangDraft,
  type LangDrafts,
} from './narrationDraft';

type ListStatus = 'loading' | 'ready' | 'error';

/**
 * Quản lý nội dung thuyết minh (PRD 7.1.5 - UC09).
 *
 * Chưa có API07 nên mỗi tab gọi API03 đúng ngôn ngữ để điền sẵn; `fallback: true`
 * nghĩa là ngôn ngữ đó chưa có nội dung nên để trống. Lưu bằng API08 (multipart),
 * hỏi "Ghi đè nội dung hiện có?" khi ngôn ngữ đã có nội dung.
 */
export function AdminContentPage() {
  const { message, modal } = App.useApp();

  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [listStatus, setListStatus] = useState<ListStatus>('loading');
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<Lang>('vi');
  const [drafts, setDrafts] = useState<LangDrafts>(createEmptyDrafts);

  // Ngôn ngữ đã gọi API03 của điểm đang chọn; đổi điểm thì xóa dấu.
  const loadedRef = useRef<Partial<Record<Lang, boolean>>>({});
  // Tăng mỗi lần đổi điểm để bỏ qua kết quả trả về muộn của điểm cũ.
  const requestRef = useRef(0);

  const patchDraft = useCallback((lang: Lang, patch: Partial<LangDraft>) => {
    setDrafts((prev) => ({ ...prev, [lang]: { ...prev[lang], ...patch } }));
  }, []);

  const loadPois = useCallback(() => {
    let active = true;

    fetchAdminLocation()
      .then((location) => {
        if (!active) return;
        setPois(location.pois);
        setListStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setListStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => loadPois(), [loadPois]);

  const retryPois = () => {
    setListStatus('loading');
    loadPois();
  };

  const loadNarration = useCallback(
    async (poiId: number, lang: Lang, force = false) => {
      if (!force && loadedRef.current[lang]) return;

      loadedRef.current[lang] = true;
      const requestId = requestRef.current;
      patchDraft(lang, { loading: true, loadError: null });

      try {
        const data = await fetchPoiContent(poiId, lang);
        if (requestId !== requestRef.current) return;

        // fallback: true -> ngôn ngữ này chưa có nội dung riêng, để trống.
        const hasContent = !data.fallback;
        patchDraft(lang, {
          loading: false,
          loaded: true,
          hasContent,
          text: hasContent ? data.text : '',
          audioUrl: hasContent ? data.audioUrl : null,
        });
      } catch (error) {
        if (requestId !== requestRef.current) return;

        loadedRef.current[lang] = false;
        patchDraft(lang, {
          loading: false,
          loadError:
            readHttpStatus(error) === 404
              ? 'Không tìm thấy điểm tham quan'
              : 'Không tải được nội dung, vui lòng thử lại',
        });
      }
    },
    [patchDraft]
  );

  // Chọn điểm thì tải tiếng Việt trước (để biết đã có bản dự phòng chưa);
  // sau đó mở tab nào mới gọi API03 cho ngôn ngữ của tab đó.
  const handleSelectPoi = (poiId: number) => {
    requestRef.current += 1;
    loadedRef.current = {};
    setSelectedPoiId(poiId);
    setDrafts(createEmptyDrafts());
    setActiveLang('vi');
    void loadNarration(poiId, 'vi');
  };

  const handleTabChange = (key: string) => {
    const lang = key as Lang;
    setActiveLang(lang);
    if (selectedPoiId !== null) {
      void loadNarration(selectedPoiId, lang);
    }
  };

  const handlePickFile = (lang: Lang, file: File) => {
    const fileError = validateAudioFile(file);
    patchDraft(lang, {
      file: fileError === null ? file : null,
      fileError,
      saveError: null,
    });
  };

  const requestOverwrite = (lang: Lang) =>
    new Promise<boolean>((resolve) => {
      modal.confirm({
        title: 'Ghi đè nội dung hiện có?',
        content: `Nội dung ${LANG_LABELS[lang]} hiện có của điểm này sẽ bị thay thế.`,
        okText: 'Ghi đè',
        cancelText: 'Hủy',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  const submitTranslation = async (poiId: number, lang: Lang, draft: LangDraft) => {
    const requestId = requestRef.current;
    patchDraft(lang, { saving: true, progress: 0, saveError: null, textError: null });

    try {
      const result = await savePoiTranslation(
        poiId,
        lang,
        draft.text.trim(),
        draft.file,
        (percent) => {
          if (requestId === requestRef.current) patchDraft(lang, { progress: percent });
        }
      );

      if (requestId !== requestRef.current) return;

      setDrafts((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          saving: false,
          progress: 0,
          file: null,
          fileError: null,
          loaded: true,
          hasContent: true,
          audioUrl: result.audioUrl,
          audioVersion: prev[lang].audioVersion + 1,
        },
      }));
      message.success('Đã lưu nội dung thuyết minh');
    } catch (error) {
      if (requestId !== requestRef.current) return;
      // 401 đã được interceptor xử lý: xóa phiên và chuyển về trang đăng nhập.
      if (readHttpStatus(error) === 401) return;

      const parsed = readApiError(error);
      patchDraft(lang, {
        saving: false,
        progress: 0,
        saveError:
          parsed.status === null
            ? 'Không kết nối được máy chủ. Vui lòng thử lại.'
            : parsed.message,
      });
    }
  };

  const handleSave = async (lang: Lang) => {
    const draft = drafts[lang];
    if (draft.saving || selectedPoiId === null) return;

    if (draft.text.trim() === '') {
      patchDraft(lang, {
        textError: 'Vui lòng nhập nội dung thuyết minh',
        saveError: null,
      });
      return;
    }

    patchDraft(lang, { textError: null, saveError: null });

    if (draft.hasContent && !(await requestOverwrite(lang))) return;

    await submitTranslation(selectedPoiId, lang, draft);
  };

  const viDraft = drafts.vi;
  const showViReminder =
    selectedPoiId !== null && viDraft.loaded && !viDraft.hasContent;

  const tabItems = ADMIN_LANGS.map((lang) => ({
    key: lang,
    label: (
      <span>
        {LANG_LABELS[lang]}
        {drafts[lang].hasContent && (
          <CheckCircleFilled className="admin-tab-check" aria-label="đã có nội dung" />
        )}
      </span>
    ),
    children: (
      <NarrationEditor
        draft={drafts[lang]}
        onTextChange={(text) => patchDraft(lang, { text, textError: null })}
        onPickFile={(file) => handlePickFile(lang, file)}
        onClearFile={() => patchDraft(lang, { file: null, fileError: null })}
        onSave={() => {
          void handleSave(lang);
        }}
        onRetryLoad={() => {
          if (selectedPoiId !== null) void loadNarration(selectedPoiId, lang, true);
        }}
        onRetrySave={() => {
          if (selectedPoiId === null) return;
          void submitTranslation(selectedPoiId, lang, drafts[lang]);
        }}
      />
    ),
  }));

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <Typography.Title level={4} className="admin-page-title">
            Quản lý nội dung thuyết minh
          </Typography.Title>
          <Typography.Text type="secondary">
            Nhập bài thuyết minh và tải file mp3 cho từng điểm, từng ngôn ngữ.
          </Typography.Text>
        </div>
      </header>

      {listStatus === 'loading' && (
        <div className="admin-center">
          <Spin size="large" />
        </div>
      )}

      {listStatus === 'error' && (
        <Result
          status="error"
          title="Không tải được danh sách điểm tham quan"
          subTitle="Kiểm tra kết nối tới máy chủ rồi thử lại."
          extra={
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={retryPois}
            >
              Thử lại
            </Button>
          }
        />
      )}

      {listStatus === 'ready' && pois.length === 0 && (
        <Empty
          className="admin-empty"
          description="Chưa có điểm tham quan nào. Hãy thêm điểm trước khi nhập nội dung."
        />
      )}

      {listStatus === 'ready' && pois.length > 0 && (
        <>
          <div className="admin-toolbar">
            <Typography.Text strong>Chọn điểm tham quan</Typography.Text>
            <Select<number>
              className="admin-poi-select"
              placeholder="Chọn điểm tham quan"
              showSearch
              optionFilterProp="label"
              value={selectedPoiId ?? undefined}
              onChange={handleSelectPoi}
              options={pois.map((poi) => ({ value: poi.id, label: poi.name }))}
            />
          </div>

          {showViReminder && (
            <Alert
              className="admin-notice"
              type="warning"
              showIcon
              title="Nên nhập bản tiếng Việt trước, vì đây là ngôn ngữ dự phòng"
            />
          )}

          {selectedPoiId === null ? (
            <Empty className="admin-empty" description="Hãy chọn một điểm tham quan" />
          ) : (
            <Tabs
              activeKey={activeLang}
              onChange={handleTabChange}
              items={tabItems}
            />
          )}
        </>
      )}
    </div>
  );
}
