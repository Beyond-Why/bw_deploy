import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { markAllRead, markOneRead } from "@/lib/notifications";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id;

  if (id !== undefined && typeof id !== "string") {
    return NextResponse.json({ error: "id must be a string" }, { status: 400 });
  }

  if (id) {
    await markOneRead(user.id, id);
  } else {
    await markAllRead(user.id);
  }

  return NextResponse.json({ ok: true });
}
