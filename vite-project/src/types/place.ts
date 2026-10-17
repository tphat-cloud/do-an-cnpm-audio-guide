export interface NarrationItem {
  language: string;       // vi, en, ja, ko, zh
  languageName: string;   // Tiếng Việt, English, ...
  flag: string;           // 🇻🇳, 🇬🇧, ...
  voiceName: string;      // Giọng đọc AI
  audioUrl: string;       // link mp3
  title: string;          // Tiêu đề bằng tiếng tương ứng
  narrationText: string;  // Lời bình thuyết minh
}

export interface TouristPlace {
  id: string;
  name: string;
  category: 'ditich' | 'thangcanh' | 'baotang' | 'tongiao';
  categoryLabel: string;
  city: string;
  imageUrl: string;
  shortDesc: string;
  historyText: string;
  openingHours: string;
  ticketPrice: string;
  totalListens: number;
  narrations: NarrationItem[];
}
