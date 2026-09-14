import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign-in error — Beyond Why",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className={`noNavPage ${styles.page}`}>
      <Link href="/" className={styles.wordmark}>
        Beyond Why
      </Link>

      <div className={styles.content}>
        <h1 className={styles.headline}>Something went wrong.</h1>
        <p className={styles.subtext}>
          Your sign-in link may have expired or already been used. Try signing in again.
        </p>
        {message && <p className={styles.debug}>{message}</p>}

        <Link href="/signin" className={styles.button}>
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
