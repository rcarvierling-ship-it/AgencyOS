export type WebsiteAuditResult={url:string;overall:number;design:number;mobile:number;performance:number;seo:number;accessibility:number;conversion:number;findings:string[];signals:Record<string,string|number|boolean>};

function scoreClamp(value:number){return Math.max(0,Math.min(100,Math.round(value)));}

export async function auditWebsite(input:string|null|undefined):Promise<WebsiteAuditResult>{
  if(!input){return {url:"",overall:94,design:100,mobile:100,performance:100,seo:88,accessibility:96,conversion:86,findings:["No website detected. A modern conversion-focused website is the primary opportunity."],signals:{websitePresent:false}};}
  const url=input.startsWith("http")?input:`https://${input}`;
  const findings:string[]=[];
  let html=""; let responseStatus=0; let loadMs=0;
  const started=Date.now();
  try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);const response=await fetch(url,{redirect:"follow",signal:controller.signal,headers:{"user-agent":"AgencyOS Website Auditor/1.0"},cache:"no-store"});clearTimeout(timer);responseStatus=response.status;html=(await response.text()).slice(0,150000);loadMs=Date.now()-started;}catch{findings.push("The site could not be fetched reliably from the audit server.");}
  const lower=html.toLowerCase();
  const hasViewport=/name=["']viewport["'][^>]*content=/i.test(html); const hasTitle=/<title[^>]*>\s*[^<]{3,}\s*<\/title>/i.test(html); const hasDescription=/<meta[^>]+name=["']description["'][^>]+content=/i.test(html); const hasH1=/<h1\b[^>]*>/i.test(html); const hasCta=/(contact|call|quote|estimate|book|schedule|get started|request)/i.test(html); const hasImages=/<img\b/i.test(html); const https=url.startsWith("https://");
  if(!hasViewport) findings.push("No responsive viewport meta tag detected.");
  if(!hasTitle) findings.push("Page title is missing or unusually short.");
  if(!hasDescription) findings.push("Meta description is missing.");
  if(!hasH1) findings.push("No clear H1 heading was detected.");
  if(!hasCta) findings.push("No obvious conversion call-to-action was detected.");
  if(!https) findings.push("The submitted URL is not HTTPS.");
  if(loadMs>4000) findings.push("Initial HTML response was slow to retrieve.");
  const mobile=hasViewport?90:42;
  const seo=(hasTitle?22:0)+(hasDescription?18:0)+(hasH1?18:0)+(https?12:0)+(hasViewport?10:0)+20;
  const performance=loadMs===0?45:scoreClamp(100-Math.max(0,loadMs-700)/45);
  const design=scoreClamp((hasH1?25:10)+(hasImages?25:10)+(hasCta?20:8)+(html.length>12000?20:12)+(hasViewport?10:0));
  const conversion=scoreClamp((hasCta?60:20)+(hasH1?15:0)+(hasImages?10:0)+(hasDescription?5:0));
  const accessibility=scoreClamp((hasViewport?30:10)+(hasH1?25:10)+(hasImages?20:8)+(https?15:0));
  const overall=scoreClamp(design*.18+mobile*.16+performance*.16+seo*.18+accessibility*.12+conversion*.20+(responseStatus>=200&&responseStatus<400?5:-5));
  return {url,overall,design,mobile,performance,seo:scoreClamp(seo),accessibility,conversion,findings,signals:{status:responseStatus,loadMs,hasViewport,hasTitle,hasDescription,hasH1,hasCta,hasImages,https,contentLength:html.length,wordPress:lower.includes("wp-content")}};
}
