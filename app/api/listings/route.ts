import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createListingSchema } from "@/lib/validations";
import { sendAlertNotification } from "@/lib/email";
import { haversineKm } from "@/lib/utils";

// GET /api/listings — list with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = 12;

    const where = {
      status: "ACTIVE" as const,
      ...(q && {
        OR: [
          { medicineName: { contains: q, mode: "insensitive" as const } },
          { genericName: { contains: q, mode: "insensitive" as const } },
          { title: { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(category && { category: { slug: category } }),
    };

    const [listings, total] = await Promise.all([
      db.listing.findMany({
        where,
        include: {
          hospital: true,
          seller: { select: { id: true, name: true, email: true, image: true } },
          category: true,
        },
        orderBy: { expiryDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.listing.count({ where }),
    ]);

    return NextResponse.json({ data: listings, total, page, pageSize });
  } catch (err) {
    console.error("[GET /api/listings]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/listings — create a new listing
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const hospitalId = (session.user as any).hospitalId;

    if (!hospitalId) {
      return NextResponse.json(
        { error: "You must be associated with a hospital to create listings." },
        { status: 403 }
      );
    }

    const hospital = await db.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital?.verified) {
      return NextResponse.json(
        { error: "Your hospital is pending verification. You cannot create listings yet." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { expiryDate, ...rest } = parsed.data;

    const listing = await db.listing.create({
      data: {
        ...rest,
        expiryDate: new Date(expiryDate),
        currency: rest.currency ?? "EUR",
        sellerId: userId,
        hospitalId,
      },
    });

    // Fire-and-forget: notify users whose alerts match this listing
    notifyMatchingAlerts(listing, hospital).catch((err) =>
      console.error("[alerts] notification error:", err)
    );

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error("[POST /api/listings]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

async function notifyMatchingAlerts(
  listing: { id: string; title: string; medicineName: string; genericName: string | null; atcCode: string | null; sellerId: string },
  sellerHospital: { name: string; latitude: number | null; longitude: number | null }
) {
  const alerts = await db.medicineAlert.findMany({
    where: { active: true, userId: { not: listing.sellerId } },
    include: { user: { select: { id: true, email: true, name: true, hospitalId: true } } },
  });

  await Promise.all(
    alerts.map(async (alert) => {
      // Name match: alert medicineName contained in listing medicineName or genericName (case-insensitive)
      const term = alert.medicineName.toLowerCase();
      const nameMatch =
        listing.medicineName.toLowerCase().includes(term) ||
        (listing.genericName?.toLowerCase().includes(term) ?? false);

      // ATC match: if alert has atcCode, listing must also have it and they must match (prefix is fine)
      const atcMatch =
        !alert.atcCode ||
        (!!listing.atcCode && listing.atcCode.toLowerCase().startsWith(alert.atcCode.toLowerCase()));

      if (!nameMatch || !atcMatch) return;

      // Distance check
      if (alert.maxDistanceKm !== null) {
        if (!alert.user.hospitalId) return;
        const buyerHospital = await db.hospital.findUnique({
          where: { id: alert.user.hospitalId },
          select: { latitude: true, longitude: true },
        });
        if (
          !buyerHospital?.latitude || !buyerHospital?.longitude ||
          !sellerHospital.latitude || !sellerHospital.longitude
        ) return; // can't check distance — skip

        const dist = haversineKm(
          buyerHospital.latitude, buyerHospital.longitude,
          sellerHospital.latitude, sellerHospital.longitude
        );
        if (dist > alert.maxDistanceKm) return;
      }

      await sendAlertNotification({
        recipientEmail: alert.user.email,
        recipientName: alert.user.name,
        medicineName: alert.medicineName,
        listingTitle: listing.title,
        listingId: listing.id,
        sellerHospital: sellerHospital.name,
      });
    })
  );
}
