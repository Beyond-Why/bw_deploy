interface IconProps {
  size?: number;
  className?: string;
}

/* A vertical line threading 3 nodes — top two filled, bottom hollow — an unfinished path. */
export function BuilderLogIcon({ size = 24, className }: IconProps) {
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
      <line x1="12" y1="4" x2="12" y2="20" />
      <circle cx="12" cy="6" r="2.1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      {/* Hollow: no fill override, inherits the svg's fill="none" stroke="currentColor" */}
      <circle cx="12" cy="18" r="1.6" />
    </svg>
  );
}
