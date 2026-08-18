import { NextResponse } from "next/server";
import { businesses, websiteAudits, businessActivities } from "@agencyos/db/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "@agencyos/db/client";
import { auditWebsite } from "../../../../../lib/website-audit";

export async function POST(_request:Request,{params}:{params:Promise<{slug:string}>}){
  try{
    const {slug}=await params;
    const [business]=await db.select().from(businesses).where(eq(businesses.slug,slug)).limit(1);
    if(!business)return NextResponse.json({error:"Business not found."},{status:404});
    const result=await auditWebsite(business.websiteUrl);
    const [audit]=await db.insert(websiteAudits).values({businessId:business.id,url:result.url||null,overallScore:result.overall,designScore:result.design,mobileScore:result.mobile,performanceScore:result.performance,seoScore:result.seo,accessibilityScore:result.accessibility,conversionScore:result.conversion,findings:{items:result.findings,signals:result.signals}}).returning();
    const opportunityScore=result.overall<50?Math.min(98,Math.round(72+(50-result.overall)*.45)):Math.max(35,Math.round(92-(result.overall-50)*.65));
    const status=business.status==="discovered"?"researching":business.status;
    const [updated]=await db.update(businesses).set({opportunityScore, status, updatedAt:new Date()}).where(eq(businesses.id,business.id)).returning();
    await db.insert(businessActivities).values({businessId:business.id,type:"website_audit",title:"Website audit completed",detail:`Website scored ${result.overall}/100. Opportunity score updated to ${opportunityScore}/100.`,metadata:{auditId:audit.id,findings:result.findings}});
    return NextResponse.json({business:updated,audit,result});
  }catch(error){console.error("AgencyOS website audit failed",error);return NextResponse.json({error:"Website audit failed."},{status:503});}
}

export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){
  try{const {slug}=await params;const [business]=await db.select({id:businesses.id}).from(businesses).where(eq(businesses.slug,slug)).limit(1);if(!business)return NextResponse.json({error:"Business not found."},{status:404});const audits=await db.select().from(websiteAudits).where(eq(websiteAudits.businessId,business.id)).orderBy(desc(websiteAudits.createdAt)).limit(10);return NextResponse.json({audits});}catch(error){console.error("AgencyOS audit history failed",error);return NextResponse.json({error:"Audit history unavailable."},{status:503});}
}
