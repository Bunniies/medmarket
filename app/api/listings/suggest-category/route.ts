import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { db } from "@/lib/db";

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ai = getClient();
  if (!ai) {
    return NextResponse.json({ error: "AI suggestion not available." }, { status: 503 });
  }

  const { medicineName, aicCode, atcCode } = await req.json();
  if (!medicineName) {
    return NextResponse.json({ error: "medicineName is required" }, { status: 400 });
  }

  const categories = await db.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const categoryList = categories.map((c) => `${c.slug} (${c.name})`).join(", ");

  const message = await ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 32,
    messages: [
      {
        role: "user",
        content: `You are a pharmacy classification assistant. Given a medicine, pick the single most appropriate category slug from the available list. Reply with only the slug — nothing else.

Medicine name: ${medicineName}
AIC code: ${aicCode || "unknown"}
ATC code: ${atcCode || "unknown"}

Available categories: ${categoryList}

If none match, reply: none`,
      },
    ],
  });

  const raw = (message.content[0] as { text: string }).text.trim().toLowerCase();
  const match = categories.find((c) => c.slug === raw);

  return NextResponse.json({
    categoryId: match?.id ?? null,
    categoryName: match?.name ?? null,
  });
}
