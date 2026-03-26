import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createListingSchema } from "@/lib/validations";

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

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    console.error("[POST /api/listings]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
