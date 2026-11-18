import { ICONS, type IconName } from "./iconPaths";
import styles from "./Icon.module.css";

interface IconProps {
  name: IconName;
  /** Pixel size. 14–16 in meta lines, 20 in buttons and the tab bar, 24+ beside headings. */
  size?: number;
  /** Set only when the icon stands alone and carries meaning; otherwise it is hidden from screen readers. */
  label?: string;
  className?: string;
}

/** The one icon component. Paths come from iconPaths.ts (trusted, static markup). */
export function Icon({ name, size = 20, label, className }: IconProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  return (
    <svg
      className={className ? `${styles.icon} ${className}` : styles.icon}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={size >= 40 ? 1.4 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...a11y}
      dangerouslySetInnerHTML={{ __html: ICONS[name].body }}
    />
  );
}

export type { IconName };
