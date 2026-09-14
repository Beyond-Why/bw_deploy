import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { updateProfileAvatar } from "@/lib/profile";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const avatarUrl = body?.avatarUrl;

  if (typeof avatarUrl !== "string" || !avatarUrl) {
    return NextResponse.json({ error: "avatarUrl is required" }, { status: 400 });
  }

  await updateProfileAvatar(user.id, avatarUrl);
  return NextResponse.json({ ok: true });
}
