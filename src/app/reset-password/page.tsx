import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { getCurrentUser } from "@/lib/auth/getUser";

export const metadata: Metadata = {
  title: "Choose a new password — Beyond Why",
};

/**
 * Reached only via the /auth/callback exchange from a password-reset
 * email link, which leaves a real session in place by the time this
 * renders — no session means the visitor got here some other way (a
 * stale/reused link, or navigating here directly), so bounce to sign in
 * rather than showing a form that would just fail on submit.
 */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }

  return (
    <AuthShell contextLabel="RESET PASSWORD" tagline="Think deeper. Read better.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
