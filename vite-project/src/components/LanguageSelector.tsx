import { Segmented } from 'antd';
import { LANGUAGE_OPTIONS } from '../i18n/messages';
import type { Lang } from '../types';

interface Props {
  value: Lang;
  onChange: (lang: Lang) => void;
}

/** Chọn 1 trong 5 ngôn ngữ (UC03 - PRD 7.1.1). */
export function LanguageSelector({ value, onChange }: Props) {
  return (
    <Segmented
      block
      className="stg-lang"
      value={value}
      onChange={(next) => onChange(next as Lang)}
      options={LANGUAGE_OPTIONS.map((item) => ({
        value: item.value,
        label: item.label,
        title: item.name,
      }))}
    />
  );
}
