import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "./SignUpForm";
import { getCurrentUser } from "@/lib/auth/getUser";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Create account — Beyond Why",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = safeRedirectPath(params.next);

  const user = await getCurrentUser();
  if (user) {
    redirect(redirectTo);
  }

  return (
    <AuthShell tagline="Serialized deep dives and insight cards, for the parts of a subject the syllabus skips.">
      <SignUpForm redirectTo={redirectTo} />
    </AuthShell>
  );
}
