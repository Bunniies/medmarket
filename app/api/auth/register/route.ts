import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema, inviteRegisterSchema } from "@/lib/validations";
import { geocodeCity } from "@/lib/geocode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Invite-based registration ──────────────────────────────────────────────
    if (body.token) {
      const parsed = inviteRegisterSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
      }

      const { name, email, password, token } = parsed.data;

      const invitation = await db.invitation.findUnique({
        where: { token },
        include: { hospital: true },
      });

      if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invalid or expired invitation." }, { status: 400 });
      }

      if (invitation.email !== email) {
        return NextResponse.json({ error: "Email does not match the invitation." }, { status: 400 });
      }

      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await db.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "HOSPITAL_STAFF",
            hospitalId: invitation.hospitalId,
          },
        });
        await tx.invitation.update({
          where: { token },
          data: { status: "ACCEPTED" },
        });
        return newUser;
      });

      return NextResponse.json({ id: user.id }, { status: 201 });
    }

    // ── Standard registration (new hospital) ──────────────────────────────────
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password, hospitalName, hospitalCity, hospitalCountry } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const slug =
      hospitalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      Date.now();

    const coords = await geocodeCity(hospitalCity, hospitalCountry);

    const user = await db.$transaction(async (tx) => {
      const hospital = await tx.hospital.create({
        data: {
          name: hospitalName,
          slug,
          address: "",
          city: hospitalCity,
          country: hospitalCountry,
          verified: false,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        },
      });

      return tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "HOSPITAL_ADMIN",
          hospitalId: hospital.id,
        },
      });
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/register]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
