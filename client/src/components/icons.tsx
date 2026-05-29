/**
 * Набор SVG-иконок в едином line-стиле (24×24, currentColor).
 * Стиль соответствует открытым иконкам svgrepo (CC0/MIT): тонкая обводка,
 * скруглённые концы. Цвет наследуется от родителя через `currentColor`.
 */
import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

/** Дипломная работа — документ с текстом */
export function DocumentIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6M9 9h1" />
    </svg>
  );
}

/** Презентация — столбчатая диаграмма */
export function ChartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20h16" />
      <rect x="6" y="11" width="3" height="6" rx="0.5" />
      <rect x="11" y="7" width="3" height="10" rx="0.5" />
      <rect x="16" y="13" width="3" height="4" rx="0.5" />
    </svg>
  );
}

/** Сайт по диплому — глобус */
export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.4 3.8 5.6 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3z" />
    </svg>
  );
}

/** Речь к защите — микрофон */
export function MicIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 17v4M8 21h8" />
    </svg>
  );
}

/** Галочка для списков преимуществ */
export function CheckIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 2.25, ...props })}>
      <path d="M5 12.5l5 5 9-11" />
    </svg>
  );
}

/** Копировать */
export function CopyIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

/** Скачать */
export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

/** Банковская карта */
export function CardIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h4" />
    </svg>
  );
}

/** Криптовалюта / TON — ромб */
export function DiamondIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4h14l2.5 5.5L12 21 2.5 9.5z" />
      <path d="M2.5 9.5h19" />
      <path d="M9 4l-2 5.5M15 4l2 5.5M12 21 9 9.5M12 21l3-11.5" />
    </svg>
  );
}

/** Иконка пустого состояния — лист с карандашом */
export function PencilDocIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 1.5, ...props })}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
      <path d="M14 3v5h5" />
      <path d="M19 14.5l2.5 2.5L16 22.5 13 23l.5-3z" />
    </svg>
  );
}

/** Иконка-искра для бейджа */
export function SparkIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 1.5, ...props })}>
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
      <path d="M12 9l.8 2.2L15 12l-2.2.8L12 15l-.8-2.2L9 12l2.2-.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** GitHub */
export function GithubIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 1.5, ...props })}>
      <path d="M9 19c-4.3 1.3-4.3-2.2-6-2.7m12 5.7v-3.6c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6.1 0-1.3-.5-2.4-1.3-3.2.1-.3.6-1.6-.1-3.2 0 0-1.1-.3-3.5 1.3a12 12 0 0 0-6.3 0C6.6 3.4 5.5 3.7 5.5 3.7c-.7 1.6-.2 2.9-.1 3.2-.8.8-1.3 1.9-1.3 3.2 0 4.6 2.7 5.8 5.5 6.1-.4.4-.7 1-.5 2V22" />
    </svg>
  );
}
