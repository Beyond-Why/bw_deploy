import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password — Beyond Why",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell contextLabel="FORGOT PASSWORD" tagline="Think deeper. Read better.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
