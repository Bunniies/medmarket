import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// PATCH /api/profile/settings — update notification preferences
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();

  // Only allow known preference fields
  const data: { emailNotifyMessages?: boolean } = {};
  if (typeof body.emailNotifyMessages === "boolean") {
    data.emailNotifyMessages = body.emailNotifyMessages;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const user = await db.user.update({ where: { id: userId }, data });
  return NextResponse.json({ emailNotifyMessages: user.emailNotifyMessages });
}
