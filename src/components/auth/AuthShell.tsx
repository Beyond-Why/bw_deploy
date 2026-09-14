import { AuthBrandPanel } from "./AuthBrandPanel";
import "./auth.css";
import styles from "./AuthShell.module.css";

/**
 * Shared full-page scaffold for every auth route (signin, signup,
 * forgot-password, reset-password): two columns on desktop (brand panel
 * + form), single column (form only) on mobile, exactly 100vh with no
 * page scroll. `children` is the page's own right-panel content.
 *
 * The literal `authFullPage` class (not a CSS Modules import) is what
 * globals.css keys off of to hide the site header on these routes, and
 * what every auth component's --auth-* custom property reads resolve
 * against — see auth.css.
 */
export function AuthShell({
  children,
  tagline,
}: {
  children: React.ReactNode;
  tagline?: string;
}) {
  return (
    <div className={`authFullPage ${styles.shell}`}>
      <AuthBrandPanel tagline={tagline} />
      <div className={styles.formPanel}>
        {/* Mobile only (see .mobileMark's media query) — the desktop
            brand panel is hidden below that breakpoint, so the mark
            moves up here instead of disappearing entirely. */}
        <div className={styles.mobileMark} aria-hidden="true">
          BW
        </div>
        {children}
      </div>
    </div>
  );
}
