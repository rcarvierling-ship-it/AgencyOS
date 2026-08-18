import { NextResponse } from "next/server";

type Candidate={name:string;industry:string;city:string;state:string;website:string|null;phone:string|null;score:number;reason:string;slug:string};

const seed:Record<string,{name:string;website:string|null;phone:string|null;score:number;reason:string}[]>= {
  HVAC:[
    {name:"Harrison & Sons HVAC",website:"harrisonsons.com",phone:"(317) 555-0148",score:91,reason:"Outdated web presence with strong local-service fit."},
    {name:"Evergreen Heating & Air",website:null,phone:"(317) 555-0172",score:88,reason:"No website detected; high-intent local service category."},
    {name:"Northstar Comfort Systems",website:"northstarcomfort.example",phone:"(317) 555-0131",score:82,reason:"Weak mobile presentation and unclear conversion path."},
    {name:"Meridian Mechanical",website:"meridianmechanical.example",phone:null,score:76,reason:"Thin service content and limited calls to action."},
  ],
  Roofing:[
    {name:"Summit Roofing Co.",website:"summitroofingco.com",phone:"(317) 555-0182",score:84,reason:"Weak mobile presentation and unclear calls to action."},
    {name:"Cedar Ridge Roofing",website:null,phone:"(317) 555-0150",score:90,reason:"No website detected; strong fit for a visual lead-generation site."},
    {name:"Blue Peak Exteriors",website:"bluepeak.example",phone:null,score:79,reason:"Outdated design and weak proof hierarchy."},
  ],
  Landscaping:[
    {name:"Blue Oak Landscaping",website:"blueoaklandscaping.com",phone:"(317) 555-0119",score:78,reason:"Services and service area are not clearly communicated."},
    {name:"Greenline Outdoor Living",website:null,phone:"(317) 555-0164",score:86,reason:"No website detected in initial local search."},
    {name:"Cedar & Stone Landscaping",website:"cedarstone.example",phone:"(317) 555-0190",score:74,reason:"A dated brochure-style site leaves conversion opportunity."},
  ],
};

function slugify(value:string){return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");}

export async function POST(request:Request){
  try{
    const body=await request.json();
    const industry=String(body.industry||"Local Services").trim();
    const location=String(body.location||"Indianapolis, IN").trim();
    const limit=Math.min(Math.max(Number(body.limit)||25,1),50);
    const parts=location.split(",").map((x:string)=>x.trim());
    const city=parts[0]||location; const state=parts[1]||"IN";
    const base=seed[industry]||[
      {name:`${city} ${industry} Co.`,website:null,phone:null,score:84,reason:"Local service business surfaced for website opportunity review."},
      {name:`Premier ${industry} Services`,website:`premier-${slugify(industry)}.example`,phone:null,score:77,reason:"Existing web presence appears limited and conversion-focused review is warranted."},
      {name:`${industry} Pros of ${city}`,website:null,phone:"(317) 555-0100",score:81,reason:"No website detected in the initial discovery adapter."},
    ];
    const candidates:Array<Candidate>=Array.from({length:Math.min(limit,base.length)},(_,i)=>{const x=base[i];return {...x,industry,city,state,slug:slugify(`${x.name}-${city}`)}});
    return NextResponse.json({provider:"agencyos-local-adapter",query:{industry,location,radius:Number(body.radius)||25,website:body.website||"Poor or missing",limit},candidates});
  }catch(error){console.error("AgencyOS discovery failed",error);return NextResponse.json({error:"Discovery request could not be processed."},{status:400});}
}
