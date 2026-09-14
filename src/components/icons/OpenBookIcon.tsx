interface IconProps {
  size?: number;
  className?: string;
}

/* An open book — two pages meeting at a center spine, with a few subtle
 * page lines on each side. Used only by the profile Home tab's
 * all-sections-empty state. */
export function OpenBookIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 6c-2-1.5-4.5-2-7-1.5v12c2.5-.5 5 0 7 1.5 2-1.5 4.5-2 7-1.5v-12c-2.5-.5-5 0-7 1.5z" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <line x1="6.5" y1="7" x2="10" y2="7" />
      <line x1="6.5" y1="9.5" x2="10" y2="9.5" />
      <line x1="6.5" y1="12" x2="10" y2="12" />
      <line x1="14" y1="7" x2="17.5" y2="7" />
      <line x1="14" y1="9.5" x2="17.5" y2="9.5" />
      <line x1="14" y1="12" x2="17.5" y2="12" />
    </svg>
  );
}
