import type { TouristPlace } from '../types/place';

export const initialPlaces: TouristPlace[] = [
  {
    id: 'dinh-doc-lap',
    name: 'Dinh Độc Lập (Hội trường Thống Nhất)',
    category: 'ditich',
    categoryLabel: 'Di tích lịch sử',
    city: 'TP. Hồ Chí Minh',
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1000&q=80',
    shortDesc: 'Biểu tượng lịch sử trọng đại ghi dấu thời khắc non sông liền một dải ngày 30/4/1975.',
    historyText:
      'Dinh Độc Lập được xây dựng vào năm 1962 trên nền Dinh Norodom cũ do kiến trúc sư Ngô Viết Thụ thiết kế. Công trình là sự kết hợp hài hòa giữa kiến trúc hiện đại phương Tây và triết lý phong thủy Á Đông.',
    openingHours: '08:00 - 16:30 hàng ngày',
    ticketPrice: '40.000 VNĐ / người',
    totalListens: 14250,
    narrations: [
      {
        language: 'vi',
        languageName: 'Tiếng Việt',
        flag: '🇻🇳',
        voiceName: 'Giọng Nam miền Nam (Truyền cảm)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: 'Thuyết minh Dinh Độc Lập',
        narrationText:
          'Chào mừng quý khách đến với Dinh Độc Lập – Di tích quốc gia đặc biệt tại trung tâm Thành phố Hồ Chí Minh. Nơi đây từng là cơ quan đầu não của chính quyền Việt Nam Cộng hòa trước năm 1975. Tòa dinh thự rộng lớn này mang ý nghĩa lịch sử sâu sắc, ghi dấu khoảnh khắc hòa bình thống nhất đất nước.',
      },
      {
        language: 'en',
        languageName: 'English',
        flag: '🇬🇧',
        voiceName: 'English (US - Natural Female)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: 'Independence Palace Audio Tour',
        narrationText:
          'Welcome to the Independence Palace, also known as the Reunification Convention Hall. This iconic landmark in Ho Chi Minh City stands as a powerful symbol of Vietnam modern history, famously marking the end of the Vietnam War on April 30, 1975.',
      },
      {
        language: 'ja',
        languageName: '日本語',
        flag: '🇯🇵',
        voiceName: 'Japanese (Standard Polite)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: '統一会堂 音声ガイド',
        narrationText:
          'ホーチミン市の中心部に位置する統一会堂へようこそ。1975年4月30日にベトナム戦争が終結した歴史的な場所として知られ、建築家ゴー・ヴィエット・トゥーによって設計された見事なモダニズム建築です。',
      },
      {
        language: 'ko',
        languageName: '한국어',
        flag: '🇰🇷',
        voiceName: 'Korean (Clear Male)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: '통일궁 오디오 가이드',
        narrationText:
          '호치민시의 역사적 중심지인 통일궁에 오신 것을 환영합니다. 1975년 베트남 전쟁 종식의 역사적 순간을 간직한 국립 유적지입니다.',
      },
      {
        language: 'zh',
        languageName: '中文',
        flag: '🇨🇳',
        voiceName: 'Mandarin (Standard)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: '统一宫 语音导览',
        narrationText:
          '欢迎来到胡志明市统一宫（独立宫）。这里是越南现代历史的重要见证地，展示了越南民族走向和平与统一的辉煌篇章。',
      },
    ],
  },
  {
    id: 'chua-mot-cot',
    name: 'Chùa Một Cột (Diên Hựu Tự)',
    category: 'tongiao',
    categoryLabel: 'Văn hóa - Tôn giáo',
    city: 'Hà Nội',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80',
    shortDesc: 'Kiến trúc hoa sen ngàn năm độc nhất vô nhị của Thủ đô Hà Nội ngàn năm văn hiến.',
    historyText:
      'Chùa được vua Lý Thái Tông khởi công xây dựng vào mùa đông năm Kỷ Sửu (1049). Tương truyền, nhà vua nằm mơ thấy Phật Bà Quan Âm dắt ngài lên tòa sen nên đã dựng chùa trên một cột đá giữa hồ Linh Chiểu.',
    openingHours: '07:00 - 18:00 hàng ngày',
    ticketPrice: 'Miễn phí tham quan',
    totalListens: 9820,
    narrations: [
      {
        language: 'vi',
        languageName: 'Tiếng Việt',
        flag: '🇻🇳',
        voiceName: 'Giọng Nữ miền Bắc (Trang trọng)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: 'Thuyết minh Chùa Một Cột',
        narrationText:
          'Quý khách đang chiêm ngưỡng Chùa Một Cột, ngôi cổ tự linh thiêng được xây dựng từ thế kỷ 11 thời nhà Lý. Chùa có kết cấu độc đáo như một đóa sen ngát hương vươn lên từ mặt nước hồ Linh Chiểu, tượng trưng cho trí tuệ và sự thanh tịnh.',
      },
      {
        language: 'en',
        languageName: 'English',
        flag: '🇬🇧',
        voiceName: 'English (UK - Storyteller)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: 'One Pillar Pagoda Audio Story',
        narrationText:
          'Welcome to the One Pillar Pagoda in Hanoi, one of Vietnam most iconic Buddhist sanctuaries. Built in 1049 by Emperor Ly Thai Tong, its delicate structure resembles a lotus blossom sprouting from a tranquil pond.',
      },
    ],
  },
  {
    id: 'pho-co-hoi-an',
    name: 'Đô Thị Cổ Hội An',
    category: 'ditich',
    categoryLabel: 'Di sản thế giới',
    city: 'Quảng Nam',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1000&q=80',
    shortDesc: 'Thương cảng quốc tế sầm uất thế kỷ 16-17 với những mái ngói rêu phong và đèn lồng rực rỡ.',
    historyText:
      'Hội An từng là thương cảng sầm uất bậc nhất Đông Nam Á, nơi giao thương giữa các thương nhân Nhật Bản, Trung Hoa, Bồ Đào Nha và Hà Lan. Nơi đây được UNESCO công nhận là Di sản Văn hóa Thế giới năm 1999.',
    openingHours: 'Mở cửa cả ngày (khu phố đi bộ từ 09:00 - 21:30)',
    ticketPrice: '80.000 VNĐ / vé tham quan các di tích',
    totalListens: 23410,
    narrations: [
      {
        language: 'vi',
        languageName: 'Tiếng Việt',
        flag: '🇻🇳',
        voiceName: 'Giọng Nữ miền Trung (Ngọt ngào)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: 'Hành trình phố cổ Hội An',
        narrationText:
          'Chào mừng bạn đến với Phố cổ Hội An, di sản văn hóa thế giới bên dòng sông Hoài thơ mộng. Hãy dạo bước qua những con ngõ nhỏ sơn vàng, ngắm nhìn Chùa Cầu cổ kính và lắng nghe câu chuyện về thương cảng giao thương huyền thoại.',
      },
      {
        language: 'en',
        languageName: 'English',
        flag: '🇬🇧',
        voiceName: 'English (US - Cheerful)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: 'Hoi An Ancient Town Walking Tour',
        narrationText:
          'Step back in time as you explore Hoi An Ancient Town, a UNESCO World Heritage site that was once a thriving Southeast Asian trading port from the 15th to the 19th century.',
      },
    ],
  },
  {
    id: 'vinh-ha-long',
    name: 'Vịnh Hạ Long',
    category: 'thangcanh',
    categoryLabel: 'Kỳ quan thiên nhiên thế giới',
    city: 'Quảng Ninh',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80',
    shortDesc: 'Hàng ngàn đảo đá vôi kỳ vĩ vươn lên giữa làn nước ngọc bích của Vịnh Bắc Bộ.',
    historyText:
      'Vịnh Hạ Long gắn liền với truyền thuyết đàn rồng mẹ và rồng con hạ phàm cứu nước, phun ra hàng ngàn viên ngọc biến thành những đảo đá muôn hình vạn trạng để ngăn bước quân thù.',
    openingHours: '06:30 - 18:30 hàng ngày theo tour tàu',
    ticketPrice: '250.000 VNĐ / vé tuyến tham quan',
    totalListens: 31050,
    narrations: [
      {
        language: 'vi',
        languageName: 'Tiếng Việt',
        flag: '🇻🇳',
        voiceName: 'Giọng Nam trầm ấm',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: 'Truyền thuyết Vịnh Hạ Long',
        narrationText:
          'Vịnh Hạ Long – Di sản thiên nhiên thế giới hai lần được UNESCO vinh danh. Nơi đây sở hữu gần 2.000 hòn đảo đá vôi lớn nhỏ, những hang động lung linh thạch nhũ và câu chuyện huyền thoại về Đàn Rồng đáp xuống chở che cho non sông nước Việt.',
      },
      {
        language: 'en',
        languageName: 'English',
        flag: '🇬🇧',
        voiceName: 'English (Natural UK)',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/daytime_forest_bonfire.ogg',
        title: 'Ha Long Bay Audio Exploration',
        narrationText:
          'Welcome to Ha Long Bay, an emerald wonderland in the Gulf of Tonkin featuring thousands of limestone karsts and isles in various sizes and shapes, forged over 500 million years.',
      },
    ],
  },
];
