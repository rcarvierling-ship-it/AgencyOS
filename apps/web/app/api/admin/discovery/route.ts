import { NextResponse } from 'next/server'
import postgres from 'postgres'

export async function POST(request: Request){
 const body=await request.json().catch(()=>null); const city=String(body?.city||'').trim(); const category=String(body?.category||'').trim(); const radius=Number(body?.radius||25)
 if(!city||!category) return NextResponse.json({error:'City and service category are required'},{status:400})
 const url=process.env.DATABASE_URL; if(!url) return NextResponse.json({error:'Database is not configured. Connect DATABASE_URL before running discovery.'},{status:503})
 const provider=process.env.LEAD_DISCOVERY_URL
 if(!provider) return NextResponse.json({error:'Lead discovery provider is not configured yet. Set LEAD_DISCOVERY_URL for the real search provider.'},{status:503})
 try{
  const response=await fetch(provider,{method:'POST',headers:{'content-type':'application/json','authorization':process.env.LEAD_DISCOVERY_API_KEY?`Bearer ${process.env.LEAD_DISCOVERY_API_KEY}`:''},body:JSON.stringify({city,category,radius}),cache:'no-store'})
  if(!response.ok) return NextResponse.json({error:`Discovery provider returned ${response.status}`},{status:502})
  const payload=await response.json(); const businesses=Array.isArray(payload)?payload:Array.isArray(payload.businesses)?payload.businesses:[]
  const sql=postgres(url,{prepare:false,max:1}); let created=0
  try{for(const b of businesses){const name=String(b.name||'').trim();if(!name)continue;const slug=String(b.slug||name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')).slice(0,120);const website=b.websiteUrl||b.website||null;const existing=await sql<any[]>`select id from businesses where lower(name)=lower(${name}) and coalesce(city,'')=coalesce(${b.city||city},'') limit 1`;if(existing.length)continue;const [row]=await sql<any[]>`insert into businesses (id,name,slug,industry,website_url,phone,address,city,state,postal_code,country,status,opportunity_score,created_at,updated_at) values (gen_random_uuid(),${name},${slug},${category},${website},${b.phone||null},${b.address||null},${b.city||city},${b.state||null},${b.postalCode||b.postal_code||null},${b.country||'US'},'discovered',${website?null:85},now(),now()) returning id`;if(row){await sql`insert into opportunities (id,business_id,name,stage,probability,created_at,updated_at) values (gen_random_uuid(),${row.id},${name},'discovered',5,now(),now())`;created++}}}finally{await sql.end({timeout:2}).catch(()=>undefined)}
  return NextResponse.json({created,found:businesses.length})
 }catch{return NextResponse.json({error:'Discovery could not be completed'},{status:500})}
}
