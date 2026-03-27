import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createAlertSchema } from "@/lib/validations";

// GET /api/alerts — list current user's active alerts
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const alerts = await db.medicineAlert.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alerts);
}

// POST /api/alerts — create a new alert
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const body = await req.json();
  const parsed = createAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { medicineName, atcCode, maxDistanceKm } = parsed.data;

  const alert = await db.medicineAlert.create({
    data: {
      userId,
      medicineName,
      atcCode: atcCode || null,
      maxDistanceKm: maxDistanceKm ?? null,
    },
  });

  return NextResponse.json(alert, { status: 201 });
}
