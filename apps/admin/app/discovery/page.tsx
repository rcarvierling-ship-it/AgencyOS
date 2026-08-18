"use client";

import { useState } from "react";

type Candidate = { name:string; industry:string; city:string; state:string; website:string|null; phone:string|null; score:number; reason:string; slug:string };

const nav=["Overview","Discovery","Businesses","Pipeline","Demos","Outreach","Clients","Projects","Websites","Hosting","AI Operations","Analytics","Settings"];

export default function DiscoveryPage(){
  const [industry,setIndustry]=useState("HVAC");
  const [location,setLocation]=useState("Indianapolis, IN");
  const [radius,setRadius]=useState("25");
  const [website,setWebsite]=useState("Poor or missing");
  const [limit,setLimit]=useState("25");
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [candidates,setCandidates]=useState<Candidate[]>([]);
  const [imported,setImported]=useState<string[]>([]);

  async function runDiscovery(){
    setLoading(true); setMessage("");
    try{
      const response=await fetch("/api/discovery",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({industry,location,radius:Number(radius),website,limit:Number(limit)})});
      const json=await response.json();
      if(!response.ok) throw new Error(json.error||"Discovery failed");
      setCandidates(json.candidates||[]); setMessage(`${json.candidates?.length||0} candidates found. Review them before importing.`);
    }catch(error){setMessage(error instanceof Error?error.message:"Discovery failed.");}
    finally{setLoading(false)}
  }

  async function importCandidate(candidate:Candidate){
    try{
      const response=await fetch("/api/discovery/import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(candidate)});
      const json=await response.json();
      if(!response.ok) throw new Error(json.error||"Import failed");
      setImported((current)=>[...current,candidate.slug]);
      setMessage(`${candidate.name} is now in the Business Graph.`);
    }catch(error){setMessage(error instanceof Error?error.message:"Import failed.");}
  }

  return <div className="shell"><aside className="side"><div className="brand"><span className="brandMark">R</span><span>RCV <em>AGENCY</em></span></div><div className="workspace"><span className="avatar">RV</span><div><strong>AgencyOS</strong><small>Command Center</small></div></div><nav className="nav">{nav.map((x,i)=><a className={x==="Discovery"?"active":""} href={i===0?"/":`/${x.toLowerCase().replaceAll(" ","-")}`} key={x}>{x}</a>)}</nav><div className="sideBottom"><div className="statusDot"/> All systems operational</div></aside><main className="main"><header className="top"><div className="heading"><div className="kicker">Lead Intelligence</div><h1>Lead Discovery</h1><p>Find local service businesses, qualify their web presence and add the best opportunities to your Business Graph.</p></div><div className="discoveryStatus"><span className="statusDot"/> Provider ready</div></header><section className="discoveryGrid"><div className="discoveryPanel"><div className="panelHeading"><div><span className="eyebrow">01 · SEARCH</span><h2>Define your market</h2></div><span className="providerBadge">Provider: AgencyOS</span></div><div className="fieldGrid"><label>Industry<input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g. Roofing"/></label><label>City / market<input value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Louisville, KY"/></label><label>Radius<select value={radius} onChange={e=>setRadius(e.target.value)}><option value="10">10 miles</option><option value="25">25 miles</option><option value="50">50 miles</option><option value="100">100 miles</option></select></label><label>Website target<select value={website} onChange={e=>setWebsite(e.target.value)}><option>Poor or missing</option><option>Missing only</option><option>Poor only</option><option>Any website</option></select></label></div><div className="discoveryControls"><label>Max leads<select value={limit} onChange={e=>setLimit(e.target.value)}><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></label><button className="primary discoveryButton" onClick={runDiscovery} disabled={loading}>{loading?"Searching…":"Run discovery →"}</button></div><div className="providerNote"><strong>Ready for live providers.</strong><span>The current provider is a deterministic local test adapter. Later we can connect Google Places, web search, enrichment and website auditing without changing this workflow.</span></div></div><div className="discoveryPanel discoveryExplainer"><span className="eyebrow">02 · QUALIFICATION</span><h2>Every result becomes an opportunity signal.</h2><p>AgencyOS will eventually combine local business data, website quality, contactability and business fit into one score.</p><div className="signal"><span>Website quality</span><b>Audit</b></div><div className="signal"><span>Business fit</span><b>Industry + market</b></div><div className="signal"><span>Contactability</span><b>Phone + email</b></div><div className="signal"><span>Sales readiness</span><b>Opportunity score</b></div></div></section>{message&&<div className="discoveryMessage">{message}</div>}<section className="section discoveryResults"><div className="sectionHead"><div><span className="eyebrow">03 · RESULTS</span><h2>Potential clients</h2></div>{candidates.length>0&&<span className="resultCount">{candidates.length} candidates</span>}</div>{candidates.length===0?<div className="emptyDiscovery"><div className="emptyIcon">⌕</div><strong>Run a discovery search</strong><span>Choose a market above and AgencyOS will return a review queue.</span></div>:<div className="panel discoveryTable"><div className="discoveryTableHead"><span>Business</span><span>Website</span><span>Opportunity</span><span>Why it surfaced</span><span></span></div>{candidates.map(candidate=><div className="candidateRow" key={candidate.slug}><div className="candidateIdentity"><div className="businessLogo">{candidate.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><strong>{candidate.name}</strong><small>{candidate.industry} · {candidate.city}, {candidate.state}</small></div></div><div className="candidateWebsite">{candidate.website||"No website found"}<small>{candidate.phone||"No phone"}</small></div><div className="candidateScore"><strong>{candidate.score}</strong><span>/100</span></div><div className="candidateReason">{candidate.reason}</div><div><button className="importButton" disabled={imported.includes(candidate.slug)} onClick={()=>importCandidate(candidate)}>{imported.includes(candidate.slug)?"Added ✓":"Add →"}</button></div></div>)}</div>}</section></main></div>;
}
