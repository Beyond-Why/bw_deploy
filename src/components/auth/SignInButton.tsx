"use client";

import { useRouter } from "next/navigation";
import styles from "../Navigation.module.css";

/**
 * Navbar's logged-out "Sign in" control. A small client component so the
 * (server-component) Navigation doesn't need to become client-side just to
 * navigate — pushes to the full-page /signin route.
 */
export function SignInButton() {
  const router = useRouter();

  return (
    <button type="button" className={styles.signIn} onClick={() => router.push("/signin")}>
      Log in
    </button>
  );
}
