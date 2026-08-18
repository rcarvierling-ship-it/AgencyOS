import { NextResponse } from "next/server";
import { businesses } from "@agencyos/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@agencyos/db/client";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [business] = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
    if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });
    return NextResponse.json({ business });
  } catch (error) {
    console.error("AgencyOS business profile lookup failed", error);
    return NextResponse.json({ error: "Business data is unavailable. Check DATABASE_URL." }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const allowed = ["name","legalName","industry","websiteUrl","phone","email","address","city","state","postalCode","country","status","opportunityScore","notes","metadata"] as const;
    const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key as typeof allowed[number])));
    if (!Object.keys(updates).length) return NextResponse.json({ error: "No editable fields supplied." }, { status: 400 });
    const [business] = await db.update(businesses).set({ ...updates, updatedAt: new Date() }).where(eq(businesses.slug, slug)).returning();
    if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });
    return NextResponse.json({ business });
  } catch (error) {
    console.error("AgencyOS business profile update failed", error);
    return NextResponse.json({ error: "Could not update business." }, { status: 503 });
  }
}
