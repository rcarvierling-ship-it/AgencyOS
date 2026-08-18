const columns = [
  ["Discovered", [["Evergreen Plumbing",73]]],
  ["Qualified", [["Northstar Electrical",81]]],
  ["Researching", [["Summit Roofing Co.",84]]],
  ["Demo Building", [["Oak & Stone Dental",86]]],
  ["Demo Ready", [["Harrison & Sons HVAC",91]]],
  ["Contacted", [["Blue Oak Landscaping",78]]],
  ["Interested", [["Precision Auto Care",88]]],
  ["Proposal", [["Riverbend Plumbing",94]]],
  ["Won", [["Modern Lawn Co.",96]]],
] as const;

export default function PipelinePage(){return <div className="shell"><aside className="side"><div className="brand">RCV Agency</div><nav className="nav"><a href="/">Overview</a><a href="/businesses">Businesses</a><a className="active" href="/pipeline">Pipeline</a><a href="/demos">Demos</a><a href="/outreach">Outreach</a><a href="/clients">Clients</a><a href="/projects">Projects</a><a href="/websites">Websites</a><a href="/hosting">Hosting</a><a href="/ai">AI Operations</a><a href="/analytics">Analytics</a><a href="/settings">Settings</a></nav></aside><main className="main"><header className="top"><div><div className="kicker">Sales Engine</div><h1 className="title">Opportunity Pipeline</h1><div className="muted">Temporary sales opportunities attached to permanent business records.</div></div><span className="pill">9 stages</span></header><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(250px,1fr))",gap:14,overflowX:"auto"}}>{columns.map(([stage,items])=><section className="panel" style={{minHeight:170}} key={stage}><div style={{padding:"16px 18px",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between"}}><strong>{stage}</strong><small className="muted">{items.length}</small></div>{items.map(([name,score])=><a href={`/businesses/${name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`} key={name} style={{display:"block",textDecoration:"none",color:"inherit",padding:16,borderBottom:"1px solid var(--line)"}}><strong>{name}</strong><div style={{marginTop:7}}><span className="score">{score}/100</span><span className="muted" style={{marginLeft:10}}>website opportunity</span></div></a>)}</section>)}</div></main></div>}
