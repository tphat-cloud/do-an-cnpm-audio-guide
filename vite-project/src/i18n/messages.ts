import type { Lang } from '../types';

/** Nhãn ngắn hiển thị trên nút chọn ngôn ngữ (PRD 7.1.1). */
export const LANGUAGE_OPTIONS: { value: Lang; label: string; name: string }[] = [
  { value: 'vi', label: 'VI', name: 'Tiếng Việt' },
  { value: 'en', label: 'EN', name: 'English' },
  { value: 'zh', label: 'ZH', name: '中文' },
  { value: 'ko', label: 'KO', name: '한국어' },
  { value: 'ja', label: 'JA', name: '日本語' },
];

export const SUPPORTED_LANGS: Lang[] = LANGUAGE_OPTIONS.map((item) => item.value);

export interface UiText {
  loading: string;
  invalidQr: string;
  loadError: string;
  retry: string;
  chooseLanguage: string;
  /** Chỉ báo nhỏ khi tải lại địa danh do đổi ngôn ngữ (UC03). */
  langReloading: string;
  /** Đổi ngôn ngữ thất bại, vẫn hiện nội dung ngôn ngữ cũ (UC03 - 5b). */
  langLoadError: string;
  poiListTitle: string;
  startTour: string;
  noPoi: string;
  noPoiTour: string;
  back: string;
  tourSubtitle: string;
  selectPoiHint: string;
  mapListen: string;
  narrationTitle: string;
  narrationLoading: string;
  narrationError: string;
  emptyText: string;
  fallbackNotice: string;
  noAudioNotice: string;
  audioError: string;
  tapToPlay: string;
  pause: string;
  resume: string;
  replay: string;
  listened: string;
  finished: string;
  /** Bảng điều khiển giả lập GPS (chỉ dùng khi demo ngoài thực địa). */
  demoTitle: string;
  demoGoTo: string;
  demoClickMapOn: string;
  demoClickMapOff: string;
  demoClickHint: string;
  demoNoPosition: string;
  demoNoPoi: string;
  demoExit: string;
  /** Thu gọn / phóng to bảng giả lập GPS (nút ở header). */
  demoCollapse: string;
  demoExpand: string;
  /** Toast khi geofence tự phát thuyết minh; {name} được thay bằng tên điểm (UC04). */
  geofenceToast: string;
  /** Khoảng cách còn lại trong popup marker; {distance} là số đã định dạng (UC06/UC10). */
  distanceFromYou: string;
}

export const MESSAGES: Record<Lang, UiText> = {
  vi: {
    loading: 'Đang tải...',
    invalidQr: 'Mã QR không hợp lệ',
    loadError: 'Không tải được dữ liệu',
    retry: 'Thử lại',
    chooseLanguage: 'Chọn ngôn ngữ',
    langReloading: 'Đang đổi ngôn ngữ...',
    langLoadError: 'Không tải được nội dung ngôn ngữ mới',
    poiListTitle: 'Điểm tham quan',
    startTour: 'Bắt đầu tham quan',
    noPoi: 'Địa danh chưa có nội dung',
    noPoiTour: 'Địa danh chưa có điểm tham quan',
    back: 'Quay lại',
    tourSubtitle: 'Danh sách điểm',
    selectPoiHint: 'Chọn một điểm bên dưới để nghe thuyết minh',
    mapListen: 'Nghe thuyết minh',
    narrationTitle: 'Nội dung thuyết minh',
    narrationLoading: 'Đang tải nội dung...',
    narrationError: 'Không tải được nội dung điểm',
    emptyText: 'Điểm này chưa có nội dung thuyết minh',
    fallbackNotice: 'Chưa có bản dịch cho ngôn ngữ này',
    noAudioNotice: 'Chưa có âm thanh cho ngôn ngữ này',
    audioError: 'Không phát được âm thanh',
    tapToPlay: 'Bấm để nghe',
    pause: 'Tạm dừng',
    resume: 'Phát tiếp',
    replay: 'Nghe lại',
    listened: 'Đã nghe',
    finished: 'Đã nghe xong',
    demoTitle: 'Giả lập vị trí GPS',
    demoGoTo: 'Đến',
    demoClickMapOn: 'Bật click trên bản đồ',
    demoClickMapOff: 'Tắt click trên bản đồ',
    demoClickHint: 'Chạm vào bản đồ để di chuyển vị trí du khách',
    demoNoPosition: 'Chưa chọn vị trí giả lập',
    demoNoPoi: 'Địa danh chưa có điểm tham quan',
    demoExit: 'Thoát chế độ Demo',
    demoCollapse: 'Thu gọn',
    demoExpand: 'Mở rộng',
    geofenceToast: 'Bạn đã đến {name}, đang phát thuyết minh...',
    distanceFromYou: 'Cách bạn {distance}',
  },
  en: {
    loading: 'Loading...',
    invalidQr: 'Invalid QR code',
    loadError: 'Unable to load data',
    retry: 'Retry',
    chooseLanguage: 'Choose language',
    langReloading: 'Switching language...',
    langLoadError: 'Unable to load the selected language',
    poiListTitle: 'Points of interest',
    startTour: 'Start the tour',
    noPoi: 'This site has no content yet',
    noPoiTour: 'This site has no points of interest yet',
    back: 'Back',
    tourSubtitle: 'Points of interest',
    selectPoiHint: 'Tap a point below to hear its narration',
    mapListen: 'Listen to narration',
    narrationTitle: 'Narration',
    narrationLoading: 'Loading content...',
    narrationError: 'Unable to load this point',
    emptyText: 'No narration for this point yet',
    fallbackNotice: 'No translation for this language yet',
    noAudioNotice: 'No audio for this language yet',
    audioError: 'Unable to play audio',
    tapToPlay: 'Tap to listen',
    pause: 'Pause',
    resume: 'Resume',
    replay: 'Replay',
    listened: 'Listened',
    finished: 'Finished',
    demoTitle: 'Mock GPS location',
    demoGoTo: 'Go to',
    demoClickMapOn: 'Enable map click',
    demoClickMapOff: 'Disable map click',
    demoClickHint: 'Tap the map to move the visitor',
    demoNoPosition: 'No mock position yet',
    demoNoPoi: 'This site has no points of interest yet',
    demoExit: 'Exit demo mode',
    demoCollapse: 'Collapse',
    demoExpand: 'Expand',
    geofenceToast: 'You have arrived at {name}, playing narration...',
    distanceFromYou: '{distance} away',
  },
  zh: {
    loading: '加载中...',
    invalidQr: '二维码无效',
    loadError: '无法加载数据',
    retry: '重试',
    chooseLanguage: '选择语言',
    langReloading: '正在切换语言...',
    langLoadError: '无法加载所选语言的内容',
    poiListTitle: '景点',
    startTour: '开始参观',
    noPoi: '该景点暂无内容',
    noPoiTour: '该景点暂无景点内容',
    back: '返回',
    tourSubtitle: '景点列表',
    selectPoiHint: '点击下方景点即可收听讲解',
    mapListen: '收听讲解',
    narrationTitle: '讲解内容',
    narrationLoading: '正在加载内容...',
    narrationError: '无法加载景点内容',
    emptyText: '该景点暂无讲解内容',
    fallbackNotice: '该语言暂无翻译',
    noAudioNotice: '该语言暂无音频',
    audioError: '无法播放音频',
    tapToPlay: '点击收听',
    pause: '暂停',
    resume: '继续播放',
    replay: '重新播放',
    listened: '已收听',
    finished: '已播放完毕',
    demoTitle: '模拟 GPS 定位',
    demoGoTo: '前往',
    demoClickMapOn: '开启地图点击选点',
    demoClickMapOff: '关闭地图点击选点',
    demoClickHint: '点击地图即可移动游客位置',
    demoNoPosition: '尚未选择模拟位置',
    demoNoPoi: '该景点暂无景点内容',
    demoExit: '退出演示模式',
    demoCollapse: '收起',
    demoExpand: '展开',
    geofenceToast: '您已到达{name}，正在播放讲解...',
    distanceFromYou: '距您 {distance}',
  },
  ko: {
    loading: '불러오는 중...',
    invalidQr: '잘못된 QR 코드입니다',
    loadError: '데이터를 불러올 수 없습니다',
    retry: '다시 시도',
    chooseLanguage: '언어 선택',
    langReloading: '언어를 변경하는 중...',
    langLoadError: '선택한 언어의 콘텐츠를 불러올 수 없습니다',
    poiListTitle: '관광지',
    startTour: '관람 시작',
    noPoi: '아직 콘텐츠가 없습니다',
    noPoiTour: '아직 등록된 관광지가 없습니다',
    back: '뒤로',
    tourSubtitle: '관광지 목록',
    selectPoiHint: '아래 관광지를 선택하면 해설을 들을 수 있습니다',
    mapListen: '해설 듣기',
    narrationTitle: '해설 내용',
    narrationLoading: '콘텐츠를 불러오는 중...',
    narrationError: '관광지 콘텐츠를 불러올 수 없습니다',
    emptyText: '이 관광지에는 아직 해설이 없습니다',
    fallbackNotice: '이 언어의 번역이 아직 없습니다',
    noAudioNotice: '이 언어의 음성이 아직 없습니다',
    audioError: '음성을 재생할 수 없습니다',
    tapToPlay: '눌러서 듣기',
    pause: '일시정지',
    resume: '재생',
    replay: '다시 듣기',
    listened: '들음',
    finished: '재생 완료',
    demoTitle: 'GPS 위치 시뮬레이션',
    demoGoTo: '이동',
    demoClickMapOn: '지도 클릭 사용',
    demoClickMapOff: '지도 클릭 해제',
    demoClickHint: '지도를 눌러 방문자 위치를 이동하세요',
    demoNoPosition: '아직 모의 위치가 없습니다',
    demoNoPoi: '아직 등록된 관광지가 없습니다',
    demoExit: '데모 모드 종료',
    demoCollapse: '축소',
    demoExpand: '확대',
    geofenceToast: '{name}에 도착했습니다. 해설을 재생합니다...',
    distanceFromYou: '{distance} 거리',
  },
  ja: {
    loading: '読み込み中...',
    invalidQr: 'QRコードが無効です',
    loadError: 'データを読み込めません',
    retry: '再試行',
    chooseLanguage: '言語を選択',
    langReloading: '言語を切り替えています...',
    langLoadError: '選択した言語のコンテンツを読み込めません',
    poiListTitle: '見どころ',
    startTour: '見学を始める',
    noPoi: 'この場所にはまだコンテンツがありません',
    noPoiTour: '見どころがまだ登録されていません',
    back: '戻る',
    tourSubtitle: '見どころ一覧',
    selectPoiHint: '下の見どころを選ぶと解説が聞けます',
    mapListen: '解説を聞く',
    narrationTitle: '解説文',
    narrationLoading: 'コンテンツを読み込み中...',
    narrationError: 'コンテンツを読み込めません',
    emptyText: 'この見どころにはまだ解説がありません',
    fallbackNotice: 'この言語の翻訳はまだありません',
    noAudioNotice: 'この言語の音声はまだありません',
    audioError: '音声を再生できません',
    tapToPlay: 'タップして再生',
    pause: '一時停止',
    resume: '再開',
    replay: 'もう一度聞く',
    listened: '視聴済み',
    finished: '再生終了',
    demoTitle: 'GPS位置のシミュレーション',
    demoGoTo: '移動',
    demoClickMapOn: '地図クリックを有効化',
    demoClickMapOff: '地図クリックを無効化',
    demoClickHint: '地図をタップして訪問者の位置を移動します',
    demoNoPosition: 'モック位置が未設定です',
    demoNoPoi: '見どころがまだ登録されていません',
    demoExit: 'デモモードを終了',
    demoCollapse: '折りたたむ',
    demoExpand: '展開',
    geofenceToast: '{name}に到着しました。解説を再生します...',
    distanceFromYou: '距離 {distance}',
  },
};

export function isSupportedLang(value: string): value is Lang {
  return (SUPPORTED_LANGS as string[]).includes(value);
}

/**
 * Ngôn ngữ mặc định (PRD 2.7.3): lấy theo trình duyệt, không thuộc 5 ngôn ngữ
 * được hỗ trợ thì dùng tiếng Việt.
 */
export function detectDefaultLang(): Lang {
  const browserLang = (navigator.languages?.[0] ?? navigator.language ?? '')
    .toLowerCase()
    .split('-')[0];

  return isSupportedLang(browserLang) ? browserLang : 'vi';
}
