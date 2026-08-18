import "./pipeline.css";
import PipelineBoard from "./PipelineBoard";

export default function PipelinePage(){
  return <div className="shell"><aside className="side"><div className="brand">RCV Agency</div><nav className="nav"><a href="/">Overview</a><a href="/businesses">Businesses</a><a className="active" href="/pipeline">Pipeline</a><a href="/demos">Demos</a><a href="/outreach">Outreach</a><a href="/clients">Clients</a><a href="/projects">Projects</a><a href="/websites">Websites</a><a href="/hosting">Hosting</a><a href="/ai">AI Operations</a><a href="/analytics">Analytics</a><a href="/settings">Settings</a></nav></aside><main className="main"><header className="top"><div><div className="kicker">Sales Engine</div><h1 className="title">Opportunity Pipeline</h1><div className="muted">Move opportunities through the sales lifecycle without losing the permanent business relationship.</div></div><span className="pill">9 stages</span></header><PipelineBoard /></main></div>
}
