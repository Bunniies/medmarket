import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createOrderSchema } from "@/lib/validations";
import { sendOrderNotification } from "@/lib/email";

// POST /api/orders — place an order on a listing
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const buyerHospitalId = (session.user as any).hospitalId;

    if (!buyerHospitalId) {
      return NextResponse.json(
        { error: "You must be associated with a hospital to place orders." },
        { status: 403 }
      );
    }

    const buyerHospitalForCheck = await db.hospital.findUnique({ where: { id: buyerHospitalId } });
    if (!buyerHospitalForCheck?.verified) {
      return NextResponse.json(
        { error: "Your hospital is pending verification. You cannot place orders yet." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { listingId, quantity, notes } = parsed.data;

    // Fetch the listing with seller info for email notification
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { email: true, name: true } } },
    });

    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Listing not found or no longer active." }, { status: 404 });
    }

    if (listing.hospitalId === buyerHospitalId) {
      return NextResponse.json(
        { error: "You cannot order from your own hospital's listing." },
        { status: 400 }
      );
    }

    if (quantity > listing.quantity) {
      return NextResponse.json(
        { error: `Only ${listing.quantity} ${listing.unit} available.` },
        { status: 400 }
      );
    }

    const totalPrice = Number(listing.pricePerUnit) * quantity;

    // Create order and update listing quantity in a transaction
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          quantity,
          unitPrice: listing.pricePerUnit,
          totalPrice,
          currency: listing.currency,
          notes,
          listingId,
          buyerId: userId,
          buyerHospitalId,
          sellerHospitalId: listing.hospitalId,
        },
      });

      // Update listing quantity (or mark as SOLD if fully purchased)
      const remainingQty = listing.quantity - quantity;
      await tx.listing.update({
        where: { id: listingId },
        data: {
          quantity: remainingQty,
          status: remainingQty === 0 ? "SOLD" : "ACTIVE",
        },
      });

      return newOrder;
    });

    // Notify seller — fire and forget
    const buyerHospital = await db.hospital.findUnique({ where: { id: buyerHospitalId } });
    sendOrderNotification({
      sellerEmail: listing.seller.email,
      sellerName: listing.seller.name,
      buyerHospitalName: buyerHospital?.name ?? "A hospital",
      listingTitle: listing.title,
      medicineName: listing.medicineName,
      quantity,
      unit: listing.unit,
      totalPrice,
      currency: listing.currency,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// GET /api/orders — get orders for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orders = await db.order.findMany({
      where: { buyerId: userId },
      include: {
        listing: true,
        sellerHospital: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: orders });
  } catch (err) {
    console.error("[GET /api/orders]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
