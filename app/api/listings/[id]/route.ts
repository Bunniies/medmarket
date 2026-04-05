import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createListingSchema } from "@/lib/validations";

// GET /api/listings/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await db.listing.findUnique({
      where: { id },
      include: { hospital: true, seller: { select: { id: true, name: true, email: true, image: true } }, category: true },
    });
    if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(listing);
  } catch (err) {
    console.error("[GET /api/listings/[id]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// PATCH /api/listings/[id] — update status OR full listing fields
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
    const userId = (session.user as any).id;

    const listing = await db.listing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (listing.sellerId !== userId) {
      return NextResponse.json({ error: "Only the seller can update this listing." }, { status: 403 });
    }

    const body = await req.json();

    // Status-only update
    if (Object.keys(body).length === 1 && body.status) {
      const updated = await db.listing.update({ where: { id }, data: { status: body.status } });
      return NextResponse.json(updated);
    }

    // Full update — reuse create schema for field validation
    const { remainingQuantity, ...bodyWithoutRemaining } = body;
    const parsed = createListingSchema.safeParse(bodyWithoutRemaining);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { expiryDate, ...rest } = parsed.data;
    const updated = await db.listing.update({
      where: { id },
      data: {
        ...rest,
        expiryDate: new Date(expiryDate),
        ...(remainingQuantity !== undefined && remainingQuantity !== null && {
          remainingQuantity: Number(remainingQuantity),
        }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PATCH /api/listings/[id]]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
