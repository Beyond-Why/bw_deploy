import styles from "./Navigation.module.css";
import { Logo } from "./Logo";
import { ModeToggleBtn } from "./ModeToggleBtn";
import { UserDropdown } from "./ui/UserDropdown";
import { SignInButton } from "./auth/SignInButton";
import { NotificationBell } from "./NotificationBell";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getProfileById } from "@/lib/profile";

export async function Navigation() {
  const user = await getCurrentUser();
  const profile = user ? await getProfileById(user.id) : null;

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Logo />
        <div className={styles.rightSection}>
          <div className={styles.tools}>
            <ModeToggleBtn />
            {profile ? (
              <>
                <NotificationBell />
                <UserDropdown username={profile.username} displayName={profile.displayName} />
              </>
            ) : (
              <SignInButton />
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
