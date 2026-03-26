import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:   ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED:   ["DELIVERED"],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    const order = await db.order.findUnique({
      where: { id },
      include: { listing: { select: { sellerId: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const userId = (session.user as any).id;
    if (order.listing.sellerId !== userId) {
      return NextResponse.json({ error: "Only the seller can update order status." }, { status: 403 });
    }

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}.` },
        { status: 400 }
      );
    }

    const updated = await db.order.update({ where: { id }, data: { status } });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/orders/[id]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
