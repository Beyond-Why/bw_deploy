import type { Metadata } from "next";
import Link from "next/link";
import styles from "./TermsPage.module.css";

export const metadata: Metadata = {
  title: "Terms of Service — Beyond Why",
  description:
    "Beyond Why Terms of Service governing platform usage, account creation, intellectual property, and user content.",
};

export default function TermsOfServicePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Effective Date: September 17, 2026</p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
        <p className={styles.paragraph}>
          By accessing or using Beyond Why (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), available at{" "}
          <Link href="/" className={styles.link}>
            beyondwhy.org
          </Link>
          , you agree to be bound by these Terms of Service. If you do not agree to these terms, please
          do not access or use the platform.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Description of Platform</h2>
        <p className={styles.paragraph}>
          Beyond Why is a digital publication platform featuring serialized intellectual deep dives,
          insight cards, reading lists, and builder logs across a variety of disciplines.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>3. User Accounts & Registration</h2>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <strong>Account Creation:</strong> To access certain features (such as saving bookmarks,
            voting on polls, or leaving comments), you must create an account via direct email registration
            or Google OAuth.
          </li>
          <li className={styles.listItem}>
            <strong>Accurate Information:</strong> You agree to provide accurate and complete registration
            details, including choosing a unique username.
          </li>
          <li className={styles.listItem}>
            <strong>Security & Responsibility:</strong> You are responsible for maintaining the confidentiality
            of your login credentials and for all activities that occur under your account.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4. User Responsibilities & Code of Conduct</h2>
        <p className={styles.paragraph}>When using Beyond Why, you agree not to:</p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Impersonate another individual or organization.</li>
          <li className={styles.listItem}>
            Post hateful, harassing, unlawful, or sexually explicit content in public comments.
          </li>
          <li className={styles.listItem}>
            Attempt to breach, scan, or exploit security vulnerabilities of our platform or database.
          </li>
          <li className={styles.listItem}>Use automated scrapers or bots to disrupt platform performance.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Intellectual Property</h2>
        <p className={styles.paragraph}>
          All original articles, essays, graphics, brand marks, site designs, and proprietary code on
          Beyond Why are the intellectual property of Beyond Why and its creators, protected under copyright
          and trademark laws. You may not reproduce, redistribute, or monetize our content without express
          written permission.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>6. User Content License</h2>
        <p className={styles.paragraph}>
          You retain ownership of any comments or feedback you post on Beyond Why. By posting, you grant us
          a non-exclusive, worldwide, royalty-free license to display and distribute your comments within the
          context of the platform.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Account Suspension & Termination</h2>
        <p className={styles.paragraph}>
          We reserve the right to suspend or terminate your account at our sole discretion, without prior notice,
          if you violate these Terms of Service or engage in abusive or harmful behavior.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Disclaimers & Limitation of Liability</h2>
        <p className={styles.paragraph}>
          Beyond Why and its content are provided on an &quot;as is&quot; and &quot;as available&quot; basis
          without warranties of any kind. We do not guarantee that the platform will be uninterrupted or error-free.
          In no event shall Beyond Why be liable for indirect, incidental, or consequential damages arising from
          your use of the platform.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Changes to Terms</h2>
        <p className={styles.paragraph}>
          We reserve the right to modify these terms at any time. Notice of significant changes will be provided
          by updating the &quot;Effective Date&quot; at the top of this page. Your continued use of the platform
          after changes constitute acceptance of the updated terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>10. Contact Information</h2>
        <p className={styles.paragraph}>
          For legal inquiries or questions regarding these Terms of Service, please contact:
        </p>
        <p className={styles.paragraph}>
          <strong>Email:</strong>{" "}
          <a href="mailto:legal@beyondwhy.org" className={styles.link}>
            legal@beyondwhy.org
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
