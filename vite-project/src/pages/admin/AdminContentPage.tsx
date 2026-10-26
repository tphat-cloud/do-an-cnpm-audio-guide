import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, App, Button, Empty, Result, Select, Spin, Tabs, Typography } from 'antd';
import { CheckCircleFilled, ReloadOutlined } from '@ant-design/icons';
import {
  fetchAdminLocation,
  fetchPoiTranslations,
  readApiError,
  savePoiTranslation,
} from '../../api/admin';
import type { PoiTranslationsResponse } from '../../api/admin';
import { readHttpStatus } from '../../api/client';
import type { Lang, PoiSummary } from '../../types';
import { NarrationEditor } from './NarrationEditor';
import {
  ADMIN_LANGS,
  LANG_LABELS,
  MAX_NAME_LENGTH,
  createEmptyDrafts,
  validateAudioFile,
  type LangDraft,
  type LangDrafts,
} from './narrationDraft';

type ListStatus = 'loading' | 'ready' | 'error';

/** Đánh dấu cả 5 tab đang chờ API07. */
function markLoading(drafts: LangDrafts): LangDrafts {
  const next = { ...drafts };

  for (const lang of ADMIN_LANGS) {
    next[lang] = { ...drafts[lang], loading: true, loadError: null };
  }

  return next;
}

/** Báo lỗi tải cho cả 5 tab, vì API07 lấy một lần cho toàn bộ ngôn ngữ. */
function markLoadError(drafts: LangDrafts, loadError: string): LangDrafts {
  const next = { ...drafts };

  for (const lang of ADMIN_LANGS) {
    next[lang] = { ...drafts[lang], loading: false, loadError };
  }

  return next;
}

/** Admin đã sửa tên, văn bản hoặc chọn file mới mà chưa bấm "Lưu". */
function isDraftDirty(draft: LangDraft): boolean {
  return (
    draft.file !== null ||
    draft.name.trim() !== draft.baselineName.trim() ||
    draft.text.trim() !== draft.baselineText.trim()
  );
}

/**
 * Ghép kết quả API07 vào bản nháp của cả 5 ngôn ngữ: điền sẵn tên điểm, văn bản,
 * audio hiện có và dấu "đã có nội dung". Tab đang sửa dở được giữ nguyên để
 * trang làm mới sau mỗi lần lưu không xóa mất phần Admin đang nhập.
 */
function mergeTranslations(
  drafts: LangDrafts,
  data: PoiTranslationsResponse
): LangDrafts {
  const entries = new Map(data.translations.map((item) => [item.lang, item]));
  const next = { ...drafts };

  // Duyệt theo 5 tab để tab nào cũng được cập nhật, kể cả khi API07 thiếu ngôn ngữ.
  for (const lang of ADMIN_LANGS) {
    const current = drafts[lang];
    const entry = entries.get(lang);
    const name = entry?.name ?? '';
    const text = entry?.text ?? '';
    const audioUrl = entry?.audioUrl ?? null;
    const audioChanged = audioUrl !== current.audioUrl;
    // Admin đang sửa dở thì giữ bản nháp, chỉ cập nhật phần chưa động tới.
    const dirty = isDraftDirty(current);

    next[lang] = {
      ...current,
      loading: false,
      loadError: null,
      loaded: true,
      hasContent: entry !== undefined && entry.text !== null,
      baselineName: name,
      name: dirty ? current.name : name,
      baselineText: text,
      text: dirty ? current.text : text,
      audioUrl,
      audioVersion: audioChanged
        ? current.audioVersion + 1
        : current.audioVersion,
    };
  }

  return next;
}

/**
 * Quản lý nội dung thuyết minh (PRD 7.1.5 - UC09).
 *
 * Chọn điểm là gọi API07 một lần để lấy cả 5 ngôn ngữ: tab đã có nội dung hiện
 * dấu tích, điền sẵn văn bản và audio hiện có. Lưu bằng API08 (multipart) rồi
 * gọi lại API07; hỏi "Ghi đè nội dung hiện có?" khi ngôn ngữ đã có nội dung.
 */
export function AdminContentPage() {
  const { message, modal } = App.useApp();

  const [pois, setPois] = useState<PoiSummary[]>([]);
  const [listStatus, setListStatus] = useState<ListStatus>('loading');
  const [selectedPoiId, setSelectedPoiId] = useState<number | null>(null);
  const [activeLang, setActiveLang] = useState<Lang>('vi');
  const [drafts, setDrafts] = useState<LangDrafts>(createEmptyDrafts);

  // Tăng mỗi lần đổi điểm để bỏ qua kết quả API07 trả về muộn của điểm cũ.
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

  // API07: lấy cả 5 ngôn ngữ trong một lời gọi khi chọn điểm hoặc bấm "Thử lại".
  const loadTranslations = useCallback(async (poiId: number) => {
    const requestId = requestRef.current;
    setDrafts((prev) => markLoading(prev));

    try {
      const data = await fetchPoiTranslations(poiId);
      if (requestId !== requestRef.current) return;

      setDrafts((prev) => mergeTranslations(prev, data));
    } catch (error) {
      if (requestId !== requestRef.current) return;

      setDrafts((prev) =>
        markLoadError(
          prev,
          readHttpStatus(error) === 404
            ? 'Không tìm thấy điểm tham quan'
            : 'Không tải được nội dung, vui lòng thử lại'
        )
      );
    }
  }, []);

  // Sau khi lưu: gọi lại API07 nhưng không bật vòng xoay để không nhấp nháy.
  const refreshTranslations = useCallback(async (poiId: number) => {
    const requestId = requestRef.current;

    try {
      const data = await fetchPoiTranslations(poiId);
      if (requestId !== requestRef.current) return;

      setDrafts((prev) => mergeTranslations(prev, data));
    } catch {
      // Làm mới thất bại: giữ nội dung vừa lưu ở cục bộ, không báo lỗi thêm.
    }
  }, []);

  // Đổi điểm thì xóa bản nháp cũ và nạp lại cả 5 tab bằng API07.
  const handleSelectPoi = (poiId: number) => {
    requestRef.current += 1;
    setSelectedPoiId(poiId);
    setDrafts(createEmptyDrafts());
    setActiveLang('vi');
    void loadTranslations(poiId);
  };

  const handleTabChange = (key: string) => {
    // API07 đã nạp sẵn cả 5 ngôn ngữ nên đổi tab chỉ cần đổi tab đang mở.
    setActiveLang(key as Lang);
  };

  const retryLoad = () => {
    if (selectedPoiId !== null) void loadTranslations(selectedPoiId);
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
    const name = draft.name.trim();
    const text = draft.text.trim();

    patchDraft(lang, { saving: true, progress: 0, saveError: null, textError: null });

    try {
      const result = await savePoiTranslation(
        poiId,
        lang,
        { name, text, file: draft.file },
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
          // API08 không trả lại name nên dùng đúng giá trị vừa gửi lên.
          baselineName: name,
          name,
          nameError: null,
          baselineText: result.text,
          text: result.text,
          audioUrl: result.audioUrl,
          audioVersion: prev[lang].audioVersion + 1,
        },
      }));
      message.success('Đã lưu nội dung thuyết minh');

      // API07: cập nhật lại dấu tích và audio của cả 5 ngôn ngữ theo CSDL.
      void refreshTranslations(poiId);
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

    // Tên điểm không bắt buộc, chỉ giới hạn độ dài (PRD 5.2.3).
    if (draft.name.trim().length > MAX_NAME_LENGTH) {
      patchDraft(lang, {
        nameError: `Tên điểm tối đa ${MAX_NAME_LENGTH} ký tự`,
        saveError: null,
      });
      return;
    }

    patchDraft(lang, { textError: null, nameError: null, saveError: null });

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
        onNameChange={(name) => patchDraft(lang, { name, nameError: null })}
        onTextChange={(text) => patchDraft(lang, { text, textError: null })}
        onPickFile={(file) => handlePickFile(lang, file)}
        onClearFile={() => patchDraft(lang, { file: null, fileError: null })}
        onSave={() => {
          void handleSave(lang);
        }}
        onRetryLoad={retryLoad}
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
