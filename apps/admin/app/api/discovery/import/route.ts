import { NextResponse } from "next/server";
import { businesses, opportunities, businessActivities } from "@agencyos/db/schema";
import { db } from "@agencyos/db/client";
import { eq } from "drizzle-orm";

export async function POST(request:Request){
  try{
    const body=await request.json();
    const name=String(body.name||"").trim();
    const slug=String(body.slug||"").trim();
    if(!name||!slug) return NextResponse.json({error:"Business name and slug are required."},{status:400});
    const existing=await db.select({id:businesses.id}).from(businesses).where(eq(businesses.slug,slug)).limit(1);
    if(existing[0]) return NextResponse.json({status:"existing",businessId:existing[0].id});
    const [business]=await db.insert(businesses).values({name,slug,industry:body.industry||null,city:body.city||null,state:body.state||null,websiteUrl:body.website?`https://${body.website}`:null,phone:body.phone||null,status:"discovered",opportunityScore:Number(body.score)||null,metadata:{discoveryProvider:"agencyos-local-adapter",discoveryReason:body.reason||null}}).returning();
    const [opportunity]=await db.insert(opportunities).values({businessId:business.id,name:"Website opportunity",stage:"discovered",probability:20}).returning();
    await db.insert(businessActivities).values({businessId:business.id,opportunityId:opportunity.id,type:"discovery",title:"Business discovered",detail:"Added from Lead Discovery and placed into the Business Graph.",metadata:{provider:"agencyos-local-adapter",reason:body.reason||null}});
    return NextResponse.json({status:"created",business},{status:201});
  }catch(error){console.error("AgencyOS discovery import failed",error);return NextResponse.json({error:"Could not import candidate. Check DATABASE_URL and schema migrations."},{status:503});}
}
