import "./globals.css";
import Link from "next/link";

const nav = [
  ["Overview", "/admin"], ["Businesses", "/admin/businesses"], ["Pipeline", "/admin/pipeline"], ["Demos", "/admin/demos"], ["Outreach", "/admin/outreach"], ["Clients", "/admin/clients"], ["Projects", "/admin/projects"], ["Websites", "/admin/websites"], ["Hosting", "/admin/hosting"], ["AI Operations", "/admin/ai"], ["Analytics", "/admin/analytics"], ["Settings", "/admin/settings"]
];

export default function AdminLayout({children}:{children:React.ReactNode}){
  return <div className="min-h-screen md:grid md:grid-cols-[230px_1fr]">
    <aside className="hidden border-r border-white/10 bg-[#0b0e14] p-5 md:block">
      <div className="mb-8 px-2 text-lg font-semibold tracking-tight">AGENCY<span className="text-indigo-400">OS</span></div>
      <div className="space-y-1">{nav.map(([label,href])=><Link key={href} href={href} className="block rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/[.05] hover:text-white">{label}</Link>)}</div>
    </aside>
    <main className="min-w-0">{children}</main>
  </div>
}
