interface IconProps {
  size?: number;
  className?: string;
}

/* Three horizontal strata, each shorter than the one above — descending. */
export function DeepDiveIcon({ size = 24, className }: IconProps) {
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
      <line x1="5" y1="7" x2="19" y2="7" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}
