interface IconProps {
  size?: number;
  className?: string;
}

/* One center dot with 8 short radiating ticks — one idea. */
export function InsightCardIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      {/* 8 ticks at 45° increments, inner r=6, outer r=9.5 */}
      <line x1="12" y1="6" x2="12" y2="2.5" />
      <line x1="12" y1="18" x2="12" y2="21.5" />
      <line x1="6" y1="12" x2="2.5" y2="12" />
      <line x1="18" y1="12" x2="21.5" y2="12" />
      <line x1="7.76" y1="7.76" x2="5.28" y2="5.28" />
      <line x1="16.24" y1="16.24" x2="18.72" y2="18.72" />
      <line x1="16.24" y1="7.76" x2="18.72" y2="5.28" />
      <line x1="7.76" y1="16.24" x2="5.28" y2="18.72" />
    </svg>
  );
}
