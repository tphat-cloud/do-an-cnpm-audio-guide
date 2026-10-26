import type { Lang } from '../../types';

/** 5 tab ngôn ngữ theo đúng thứ tự PRD 7.1.5. */
export const ADMIN_LANGS: readonly Lang[] = ['vi', 'en', 'zh', 'ko', 'ja'];

export const LANG_LABELS: Record<Lang, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
};

/** Giới hạn file audio theo PRD 2.7.3 và API08. */
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

/** Tên điểm theo ngôn ngữ tối đa 255 ký tự (PRD 5.2.5 / 5.2.3). */
export const MAX_NAME_LENGTH = 255;

/** Bản nháp nội dung của một ngôn ngữ trong trang quản lý thuyết minh. */
export interface LangDraft {
  /** Đang gọi API07 để điền sẵn cả 5 ngôn ngữ. */
  loading: boolean;
  loadError: string | null;
  /** Đã nạp xong từ API07 (kể cả khi ngôn ngữ chưa có nội dung). */
  loaded: boolean;
  /** Ngôn ngữ này đã có nội dung trong CSDL -> hiện dấu tích và hỏi ghi đè. */
  hasContent: boolean;
  /** Tên điểm theo ngôn ngữ; để trống thì backend lưu NULL. */
  name: string;
  /** Tên đang lưu trong CSDL, dùng để biết Admin đã sửa dở chưa. */
  baselineName: string;
  nameError: string | null;
  text: string;
  /** Văn bản đang lưu trong CSDL, dùng để biết Admin đã sửa dở chưa. */
  baselineText: string;
  audioUrl: string | null;
  /** Tăng sau mỗi lần lưu để trình nghe thử tải lại file mới. */
  audioVersion: number;
  file: File | null;
  fileError: string | null;
  textError: string | null;
  saving: boolean;
  progress: number;
  saveError: string | null;
}

export type LangDrafts = Record<Lang, LangDraft>;

export function createEmptyDraft(): LangDraft {
  return {
    loading: false,
    loadError: null,
    loaded: false,
    hasContent: false,
    name: '',
    baselineName: '',
    nameError: null,
    text: '',
    baselineText: '',
    audioUrl: null,
    audioVersion: 0,
    file: null,
    fileError: null,
    textError: null,
    saving: false,
    progress: 0,
    saveError: null,
  };
}

export function createEmptyDrafts(): LangDrafts {
  return {
    vi: createEmptyDraft(),
    en: createEmptyDraft(),
    zh: createEmptyDraft(),
    ko: createEmptyDraft(),
    ja: createEmptyDraft(),
  };
}

/** Kiểm tra loại file và dung lượng ngay ở phía web (PRD 3.3.9 - 5a, 5b). */
export function validateAudioFile(file: File): string | null {
  if (!/\.mp3$/i.test(file.name)) return 'Chỉ chấp nhận file .mp3';
  if (file.size > MAX_AUDIO_BYTES) return 'File quá lớn, tối đa 10 MB';
  return null;
}
