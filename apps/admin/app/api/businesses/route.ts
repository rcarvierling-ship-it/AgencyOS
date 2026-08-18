import { NextResponse } from "next/server";
import { businesses } from "@agencyos/db/schema";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@agencyos/db/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 250);
    const rows = await db.select().from(businesses)
      .where(query ? or(ilike(businesses.name, `%${query}%`), ilike(businesses.city, `%${query}%`), ilike(businesses.industry, `%${query}%`)) : undefined)
      .orderBy(desc(businesses.opportunityScore), desc(businesses.createdAt))
      .limit(Number.isFinite(limit) && limit > 0 ? limit : 100);
    return NextResponse.json({ businesses: rows });
  } catch (error) {
    console.error("AgencyOS business lookup failed", error);
    return NextResponse.json({ error: "Business data is unavailable. Check DATABASE_URL." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    const slug = String(body.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    const [business] = await db.insert(businesses).values({
      name,
      slug,
      legalName: body.legalName ?? null,
      industry: body.industry ?? null,
      websiteUrl: body.websiteUrl ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      postalCode: body.postalCode ?? null,
      country: body.country ?? "US",
      status: body.status ?? "discovered",
      opportunityScore: body.opportunityScore ?? null,
      notes: body.notes ?? null,
      metadata: body.metadata ?? null,
    }).returning();
    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    console.error("AgencyOS business creation failed", error);
    return NextResponse.json({ error: "Could not create business. Check DATABASE_URL and business slug uniqueness." }, { status: 503 });
  }
}
