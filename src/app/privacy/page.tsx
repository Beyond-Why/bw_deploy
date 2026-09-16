import type { Metadata } from "next";
import Link from "next/link";
import styles from "./PrivacyPage.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Beyond Why",
  description:
    "Beyond Why Privacy Policy describing information collection, authentication practices, Google user data handling, and privacy controls.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Effective Date: September 17, 2026</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Introduction</h2>
        <p className={styles.paragraph}>
          Welcome to Beyond Why (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), accessible from{" "}
          <Link href="/" className={styles.link}>
            beyondwhy.org
          </Link>
          . Beyond Why is an independent reading platform dedicated to serialized intellectual deep
          dives, insight cards, and builder logs.
        </p>
        <p className={styles.paragraph}>
          This Privacy Policy explains how we collect, use, store, and protect your information
          when you visit our platform or use our authentication services. We are committed to
          protecting your privacy and handling your data with transparency.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
        <p className={styles.paragraph}>
          We collect minimal personal information necessary to provide and secure your account:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <strong>Account Registration Data:</strong> When you register directly with an email and
            password, we collect your full name, email address, and username. Your password is
            hashed and managed securely through Supabase Authentication; we never view or store
            raw passwords.
          </li>
          <li className={styles.listItem}>
            <strong>Google Account Data (OAuth):</strong> If you choose to sign in using Google
            Sign-In, we receive basic profile information provided by Google OAuth, specifically your
            full name, email address, and profile picture URL. We use this data strictly to populate
            your profile and authenticate your sessions.
          </li>
          <li className={styles.listItem}>
            <strong>User-Generated Content & Interaction Data:</strong> We store information you
            create within the platform, such as saved bookmarks, reading preferences, poll votes, and
            public comments.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Google User Data Handling</h2>
        <p className={styles.paragraph}>
          Beyond Why adheres strictly to Google&apos;s API Services User Data Policy regarding data
          received via Google OAuth:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <strong>Requested Scopes:</strong> We request only basic identity scopes (
            <code>openid</code>, <code>email</code>, and <code>profile</code>). We do not request
            access to Google Drive, Gmail, Google Contacts, or any other sensitive APIs.
          </li>
          <li className={styles.listItem}>
            <strong>Use of Google Data:</strong> Google user data is used exclusively to verify your
            identity, sign you in to your Beyond Why account, and display your avatar and name on your
            user profile.
          </li>
          <li className={styles.listItem}>
            <strong>No Data Transfer or Sale:</strong> We do not sell, rent, or transfer Google user
            data to third parties, data brokers, or advertising networks under any circumstances.
          </li>
          <li className={styles.listItem}>
            <strong>No Advertising or Tracking:</strong> Google user data is never used for targeting
            advertisements or user profiling.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. How We Use Your Information</h2>
        <p className={styles.paragraph}>We use the collected information solely to:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Authenticate your identity and maintain signed-in sessions.</li>
          <li className={styles.listItem}>Manage your user profile, bookmarks, and platform interactions.</li>
          <li className={styles.listItem}>
            Send essential transactional authentication emails (such as account verification links and
            password reset emails).
          </li>
          <li className={styles.listItem}>Maintain platform security and prevent unauthorized access or abuse.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Cookies & Local Storage</h2>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <strong>Essential Session Cookies:</strong> We use HTTP session cookies issued by{" "}
            <code>@supabase/ssr</code> to keep you signed in securely as you navigate the site.
          </li>
          <li className={styles.listItem}>
            <strong>Local Storage:</strong> We use client-side <code>localStorage</code> (such as{" "}
            <code>beyondwhy_auth_tagline</code>) to store local visual presentation preferences for up to
            one hour.
          </li>
          <li className={styles.listItem}>
            <strong>No Tracking Cookies:</strong> We do not use third-party tracking cookies,
            advertising pixels, or cross-site tracking scripts.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Third-Party Service Providers</h2>
        <p className={styles.paragraph}>
          We share data only with infrastructure providers required to operate the application:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <strong>Supabase:</strong> Our database and authentication host. User profiles and account
            records are stored in PostgreSQL database tables protected by Row Level Security (RLS).
          </li>
          <li className={styles.listItem}>
            <strong>Resend:</strong> Our transactional email dispatch service used to deliver account
            verification and password recovery emails from <code>auth@beyondwhy.org</code>.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Data Retention & Account Deletion</h2>
        <p className={styles.paragraph}>
          Your personal data is retained for as long as your account remains active. You may update your
          profile display name, username, and password at any time via your account settings.
        </p>
        <p className={styles.paragraph}>
          If you wish to permanently delete your account and remove your personal information from our
          systems, please contact us at{" "}
          <a href="mailto:privacy@beyondwhy.org" className={styles.link}>
            privacy@beyondwhy.org
          </a>
          . Upon verification, your user profile and account records will be purged.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Security</h2>
        <p className={styles.paragraph}>
          We employ industry-standard technical measures to protect your data, including HTTPS/TLS
          encryption for all web traffic, secure password hashing, and encrypted database connections.
          However, no method of electronic transmission is 100% secure, and we recommend using a strong,
          unique password.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Children&apos;s Privacy</h2>
        <p className={styles.paragraph}>
          Beyond Why is designed for a general audience and does not knowingly collect personal data
          from children under the age of 13. If you believe a child has provided us with personal information,
          please contact us for immediate deletion.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>10. Changes to This Privacy Policy</h2>
        <p className={styles.paragraph}>
          We may update this Privacy Policy from time to time. Any changes will be published directly on
          this page with a revised effective date.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>11. Contact Us</h2>
        <p className={styles.paragraph}>
          If you have questions or privacy concerns regarding this policy, please reach out to us:
        </p>
        <p className={styles.paragraph}>
          <strong>Email:</strong>{" "}
          <a href="mailto:privacy@beyondwhy.org" className={styles.link}>
            privacy@beyondwhy.org
          </a>
          <br />
          <strong>Website:</strong>{" "}
          <Link href="/" className={styles.link}>
            beyondwhy.org
          </Link>
        </p>
      </section>
    </div>
  );
}
